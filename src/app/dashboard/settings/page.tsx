'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Product, AdAccount, Settings } from '@/types';

export default function SettingsPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string>('');

  // Product form
  const [newProductName, setNewProductName] = useState('');
  const [newProductHotmartId, setNewProductHotmartId] = useState('');

  // Ad Account form
  const [newAdAccountId, setNewAdAccountId] = useState('');
  const [newAdAccountName, setNewAdAccountName] = useState('');

  // Settings form
  const [hottok, setHottok] = useState('');
  const [fbToken, setFbToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAdAccountModal, setShowAdAccountModal] = useState(false);
  const [editingAdAccountId, setEditingAdAccountId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
    setWebhookUrl(`${window.location.origin}/api/webhooks/hotmart`);
  }, [supabase.auth]);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    const [productsRes, adAccountsRes, settingsRes] = await Promise.all([
      supabase.from('products').select('*').eq('user_id', userId).order('name'),
      supabase.from('ad_accounts').select('*').eq('user_id', userId),
      supabase.from('settings').select('*').eq('user_id', userId).single(),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (adAccountsRes.data) setAdAccounts(adAccountsRes.data as unknown as AdAccount[]);
    if (settingsRes.data) {
      setSettings(settingsRes.data);
      setHottok(settingsRes.data.hotmart_hottok || '');
      setFbToken(settingsRes.data.fb_access_token || '');
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // ===== PRODUCTS =====
  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (editingProductId) {
      const { error } = await supabase.from('products').update({
        name: newProductName,
        hotmart_product_id: parseInt(newProductHotmartId),
      }).eq('id', editingProductId);

      if (error) {
        showMessage('error', `Erro: ${error.message}`);
      } else {
        showMessage('success', 'Produto atualizado!');
        closeProductModal();
        fetchData();
      }
    } else {
      const { error } = await supabase.from('products').insert({
        user_id: userId,
        name: newProductName,
        hotmart_product_id: parseInt(newProductHotmartId),
      });

      if (error) {
        showMessage('error', `Erro: ${error.message}`);
      } else {
        showMessage('success', 'Produto adicionado!');
        closeProductModal();
        fetchData();
      }
    }
  };

  const openEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setNewProductName(product.name);
    setNewProductHotmartId(product.hotmart_product_id.toString());
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setEditingProductId(null);
    setNewProductName('');
    setNewProductHotmartId('');
    setShowProductModal(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      showMessage('error', `Erro: ${error.message}`);
    } else {
      fetchData();
    }
  };

  // ===== AD ACCOUNTS =====
  const addAdAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (editingAdAccountId) {
      const { error } = await supabase.from('ad_accounts').update({
        fb_account_id: newAdAccountId.replace('act_', ''),
        fb_account_name: newAdAccountName || null,
      }).eq('id', editingAdAccountId);

      if (error) {
        showMessage('error', `Erro: ${error.message}`);
      } else {
        showMessage('success', 'Conta de anúncio atualizada!');
        closeAdAccountModal();
        fetchData();
      }
    } else {
      const { error } = await supabase.from('ad_accounts').insert({
        user_id: userId,
        fb_account_id: newAdAccountId.replace('act_', ''),
        fb_account_name: newAdAccountName || null,
      });

      if (error) {
        showMessage('error', `Erro: ${error.message}`);
      } else {
        showMessage('success', 'Conta de anúncio adicionada!');
        closeAdAccountModal();
        fetchData();
      }
    }
  };

  const openEditAdAccount = (account: AdAccount) => {
    setEditingAdAccountId(account.id);
    setNewAdAccountId(account.fb_account_id);
    setNewAdAccountName(account.fb_account_name || '');
    setShowAdAccountModal(true);
  };

  const closeAdAccountModal = () => {
    setEditingAdAccountId(null);
    setNewAdAccountId('');
    setNewAdAccountName('');
    setShowAdAccountModal(false);
  };

  const deleteAdAccount = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta conta?')) return;

    const { error } = await supabase.from('ad_accounts').delete().eq('id', id);
    if (error) {
      showMessage('error', `Erro: ${error.message}`);
    } else {
      fetchData();
    }
  };

  // ===== SETTINGS =====
  const saveSettings = async () => {
    if (!userId) return;

    if (settings) {
      const { error } = await supabase
        .from('settings')
        .update({ hotmart_hottok: hottok, fb_access_token: fbToken })
        .eq('user_id', userId);
      if (error) showMessage('error', `Erro: ${error.message}`);
      else showMessage('success', 'Configurações salvas!');
    } else {
      const { error } = await supabase
        .from('settings')
        .insert({ user_id: userId, hotmart_hottok: hottok, fb_access_token: fbToken });
      if (error) showMessage('error', `Erro: ${error.message}`);
      else showMessage('success', 'Configurações salvas!');
    }
    fetchData();
  };



  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}

      {/* WEBHOOK SETTINGS */}
      <div className="settings-section">
        <h2 className="settings-section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          Webhook Hotmart
        </h2>

        <div style={{ marginBottom: 'var(--space-md)', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <strong>URL do Webhook:</strong>{' '}
          <code style={{
            background: 'var(--bg-input)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            wordBreak: 'break-all',
          }}>
            {webhookUrl || 'Carregando URL...'}
          </code>
        </div>

        <div className="form-row" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hottok (Token de segurança)</label>
            <input
              type="password"
              className="form-input"
              placeholder="Cole seu hottok aqui..."
              value={hottok}
              onChange={(e) => setHottok(e.target.value)}
            />
          </div>
        </div>

        <h2 className="settings-section-title" style={{ marginTop: 'var(--space-xl)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4DA6FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
          </svg>
          Facebook Ads
        </h2>
        
        <div style={{ marginBottom: 'var(--space-md)', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Esse token único será usado para puxar os gastos de todas as contas que você adicionar abaixo. Permissão necessária: <strong>ads_read</strong>.
        </div>

        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Access Token Global</label>
            <input
              type="password"
              className="form-input"
              placeholder="System User Token..."
              value={fbToken}
              onChange={(e) => setFbToken(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={saveSettings} style={{ width: 'auto' }}>
            Salvar Configurações Globais
          </button>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <h2 className="settings-section-title" style={{ marginBottom: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
            Produtos
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowProductModal(true)}>
            + Adicionar
          </button>
        </div>

        {products.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
            <p className="empty-state-text">Nenhum produto cadastrado. Os produtos serão criados automaticamente via webhook.</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="settings-row">
              <div className="settings-item-info">
                <span className="settings-item-name">{product.name}</span>
                <span className="settings-item-detail">Hotmart ID: {product.hotmart_product_id}</span>
              </div>
              <div className="settings-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEditProduct(product)}>
                  Editar
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(product.id)}>
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AD ACCOUNTS */}
      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <h2 className="settings-section-title" style={{ marginBottom: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Contas de Anúncio (Facebook)
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdAccountModal(true)}>
              + Adicionar
            </button>
          </div>
        </div>

        {adAccounts.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
            <p className="empty-state-text">Nenhuma conta de anúncio vinculada.</p>
          </div>
        ) : (
          adAccounts.map((account) => (
            <div key={account.id} className="settings-row">
              <div className="settings-item-info">
                <span className="settings-item-name">
                  {account.fb_account_name || `act_${account.fb_account_id}`}
                </span>
                <span className="settings-item-detail">
                  ID: act_{account.fb_account_id}
                </span>
              </div>
              <div className="settings-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEditAdAccount(account)}>
                  Editar
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteAdAccount(account.id)}>
                  Remover
                </button>
              </div>
            </div>
          ))
        )}

        {syncResult && (
          <pre style={{
            background: 'var(--bg-input)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            overflow: 'auto',
            maxHeight: '200px',
            marginTop: 'var(--space-md)',
          }}>
            {syncResult}
          </pre>
        )}
      </div>

      {/* PRODUCT MODAL */}
      {showProductModal && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingProductId ? 'Editar Produto' : 'Adicionar Produto'}</h3>
            <form onSubmit={addProduct}>
              <div className="form-group">
                <label className="form-label">Nome do Produto</label>
                <input
                  className="form-input"
                  placeholder="Ex: Curso de Marketing"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">ID na Hotmart</label>
                <input
                  className="form-input"
                  placeholder="Ex: 1234567"
                  type="number"
                  value={newProductHotmartId}
                  onChange={(e) => setNewProductHotmartId(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeProductModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  {editingProductId ? 'Salvar Alterações' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AD ACCOUNT MODAL */}
      {showAdAccountModal && (
        <div className="modal-overlay" onClick={closeAdAccountModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingAdAccountId ? 'Editar Conta de Anúncio' : 'Adicionar Conta de Anúncio'}</h3>
            {!fbToken && (
              <div style={{ fontSize: '12px', color: 'var(--accent-yellow)', marginBottom: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                ⚠️ Você ainda não configurou seu <strong>Access Token Global</strong>.
              </div>
            )}
            <form onSubmit={addAdAccount}>
              <div className="form-group">
                <label className="form-label">ID da Conta (sem act_)</label>
                <input
                  className="form-input"
                  placeholder="Ex: 123456789"
                  value={newAdAccountId}
                  onChange={(e) => setNewAdAccountId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nome (opcional)</label>
                <input
                  className="form-input"
                  placeholder="Ex: Conta Principal"
                  value={newAdAccountName}
                  onChange={(e) => setNewAdAccountName(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeAdAccountModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  {editingAdAccountId ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
