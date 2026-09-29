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
    const grossCurrency = purchase?.original_offer_price?.currency_value || purchase?.price?.currency_value || 'BRL';

    // Get net value (producer commission) — note: commission has its own currency_value
    const producerCommission = commissions.find(
      (c: any) => c.source === 'PRODUCER'
    );
    const netValue = producerCommission?.value || grossValue;
    const netCurrency = producerCommission?.currency_value || grossCurrency;

    // Convert gross to BRL
    let grossBRL = grossValue;
    let exchangeRate = 1;

    if (grossCurrency !== 'BRL') {
      // Best option: if the buyer's price is already in BRL, use it directly
      // (e.g., Brazilian buyer purchasing a USD-priced product)
      const priceBRL = purchase?.price?.currency_value === 'BRL' ? purchase.price.value : null;

      if (priceBRL) {
        grossBRL = priceBRL;
        exchangeRate = grossValue > 0 ? priceBRL / grossValue : 1;
      } else if (producerCommission?.currency_conversion?.conversion_rate) {
        // Use Hotmart's conversion rate from the commission
        exchangeRate = producerCommission.currency_conversion.conversion_rate;
        grossBRL = grossValue * exchangeRate;
      } else {
        // Fallback to our exchange rate API
        const convertedGross = await convertToMBRL(grossValue, grossCurrency);
        grossBRL = convertedGross.valueBRL;
        exchangeRate = convertedGross.exchangeRate;
      }
    }

    // Convert net to BRL (only if commission currency is not already BRL)
    let netBRL = netValue;

    if (netCurrency !== 'BRL') {
      if (producerCommission?.currency_conversion?.converted_to_currency === 'BRL') {
        netBRL = producerCommission.currency_conversion.converted_value;
      } else {
        const convertedNet = await convertToMBRL(netValue, netCurrency);
        netBRL = convertedNet.valueBRL;
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
        original_currency: grossCurrency,
        exchange_rate: exchangeRate,
        gross_value_brl: grossBRL,
        net_value_brl: netBRL,
        payment_type: purchase?.payment?.type || null,
        buyer_name: buyer?.name || null,
        buyer_email: buyer?.email || null,
        buyer_country: buyer?.address?.country_iso || null,
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
