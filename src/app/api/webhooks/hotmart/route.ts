import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { convertToMBRL } from '@/lib/exchange-rate';

// Status mapping from Hotmart event types
const EVENT_STATUS_MAP: Record<string, string> = {
  PURCHASE_APPROVED: 'APPROVED',
  PURCHASE_COMPLETE: 'APPROVED',
  PURCHASE_CANCELED: 'CANCELED',
  PURCHASE_REFUNDED: 'REFUNDED',
  PURCHASE_CHARGEBACK: 'CHARGEBACK',
  PURCHASE_DELAYED: 'PENDING',
  PURCHASE_BILLET_PRINTED: 'PENDING',
  PURCHASE_PROTEST: 'PROTEST',
  PURCHASE_EXPIRED: 'EXPIRED',
};

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  );

  try {
    const body = await request.json();
    const hottok = request.headers.get('x-hotmart-hottok') || body?.hottok || request.nextUrl.searchParams.get('hottok');

    if (!hottok) {
      return NextResponse.json({ error: 'Missing hottok' }, { status: 401 });
    }

    // Verify hottok against stored settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('user_id, hotmart_hottok')
      .eq('hotmart_hottok', hottok)
      .single();

    if (!settingsData) {
      return NextResponse.json({ error: 'Invalid hottok' }, { status: 401 });
    }

    const userId = settingsData.user_id;

    const { id: eventId, event, data } = body;

    // Idempotency check
    const { data: existingEvent } = await supabase
      .from('transactions')
      .select('id')
      .eq('hotmart_event_id', eventId)
      .single();

    if (existingEvent) {
      return NextResponse.json({ message: 'Event already processed' }, { status: 200 });
    }

    const status = EVENT_STATUS_MAP[event] || 'UNKNOWN';
    const product = data?.product;
    const purchase = data?.purchase;
    const commissions = data?.commissions || [];
    const buyer = data?.buyer;

    // Get gross value (prefer original_offer_price to avoid local currency mismatches with the commission conversion)
    const grossValue = purchase?.original_offer_price?.value || purchase?.price?.value || 0;
    const currency = purchase?.original_offer_price?.currency_value || purchase?.price?.currency_value || 'BRL';

    // Get net value (producer commission)
    const producerCommission = commissions.find(
      (c: any) => c.source === 'PRODUCER'
    );
    const netValue = producerCommission?.value || grossValue;

    // Convert to BRL
    let grossBRL = grossValue;
    let netBRL = netValue;
    let exchangeRate = 1;

    if (currency !== 'BRL') {
      if (producerCommission?.currency_conversion?.converted_to_currency === 'BRL') {
        // Use Hotmart's native conversion
        netBRL = producerCommission.currency_conversion.converted_value;
        exchangeRate = producerCommission.currency_conversion.conversion_rate || 1;
        grossBRL = grossValue * exchangeRate;
      } else {
        // Fallback to our exchange rate API
        const convertedGross = await convertToMBRL(grossValue, currency);
        const convertedNet = await convertToMBRL(netValue, currency);
        grossBRL = convertedGross.valueBRL;
        netBRL = convertedNet.valueBRL;
        exchangeRate = convertedGross.exchangeRate;
      }
    }

    // Find matching product
    let productId = null;
    if (product?.id) {
      const { data: productData } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', userId)
        .eq('hotmart_product_id', product.id)
        .single();

      if (productData) {
        productId = productData.id;
      } else {
        // Auto-create product if not found
        const { data: newProduct } = await supabase
          .from('products')
          .insert({
            user_id: userId,
            hotmart_product_id: product.id,
            name: product.name || `Produto ${product.id}`,
          })
          .select('id')
          .single();

        if (newProduct) {
          productId = newProduct.id;
        }
      }
    }

    // Check if this transaction already exists (by hotmart_transaction_id)
    const transactionId = purchase?.transaction;
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('hotmart_transaction_id', transactionId)
      .eq('user_id', userId)
      .single();

    if (existingTx) {
      // Update existing transaction with new status
      await supabase
        .from('transactions')
        .update({
          event_type: event,
          status,
          hotmart_event_id: eventId,
        })
        .eq('id', existingTx.id);
    } else {
      // Insert new transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        product_id: productId,
        hotmart_transaction_id: transactionId,
        event_type: event,
        status,
        gross_value: grossValue,
        net_value: netValue,
        original_currency: currency,
        exchange_rate: exchangeRate,
        gross_value_brl: grossBRL,
        net_value_brl: netBRL,
        payment_type: purchase?.payment?.type || null,
        buyer_name: buyer?.name || null,
        buyer_email: buyer?.email || null,
        transaction_date: purchase?.approved_date
          ? new Date(purchase.approved_date).toISOString()
          : purchase?.order_date
            ? new Date(purchase.order_date).toISOString()
            : new Date().toISOString(),
        hotmart_event_id: eventId,
      });
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
