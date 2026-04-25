/**
 * src/api/services.js
 * Semua fungsi API call dikelompokkan per modul.
 * Import dari sini di komponen/hooks.
 *
 * Pattern: setiap fungsi return Promise dari axios.
 * Komponen/hooks yang memanggil bertanggung jawab handle loading & error.
 */

import api from './client'

// ── Helper: build query string dari object ────────────────────────────────────
const toParams = (obj = {}) => {
  const p = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v)
  })
  return p
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════════
export const authApi = {
  login:   (credentials) => api.post('/auth/login/', credentials),
  refresh: (refresh)     => api.post('/auth/refresh/', { refresh }),
  verify:  (token)       => api.post('/auth/verify/', { token }),
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════════════════════
export const usersApi = {
  list:           (params) => api.get('/users/', { params: toParams(params) }),
  detail:         (id)     => api.get(`/users/${id}/`),
  create:         (data)   => api.post('/users/', data),
  update:         (id, d)  => api.put(`/users/${id}/`, d),
  patch:          (id, d)  => api.patch(`/users/${id}/`, d),
  delete:         (id)     => api.delete(`/users/${id}/`),
  me:             ()       => api.get('/users/me/'),
  updateMe:       (data)   => api.patch('/users/me/', data),
  changePassword: (data)   => api.post('/users/me/change_password/', data),
  setRole:        (id, d)  => api.patch(`/users/${id}/set_role/`, d),
}

// ══════════════════════════════════════════════════════════════════════════════
// SAMPLES — Master Data
// ══════════════════════════════════════════════════════════════════════════════
export const sampleTypesApi = {
  list: () => api.get('/sample-types/'),
}

export const categoriesApi = {
  list:   (params) => api.get('/product-categories/', { params: toParams(params) }),
  detail: (id)     => api.get(`/product-categories/${id}/`),
  create: (data)   => api.post('/product-categories/', data),
  update: (id, d)  => api.put(`/product-categories/${id}/`, d),
  delete: (id)     => api.delete(`/product-categories/${id}/`),
}

export const tanksApi = {
  list:            (params) => api.get('/storage-tanks/', { params }),
  storageTanks:    ()       => api.get('/storage-tanks/storage_tanks/'),
  productionTanks: ()       => api.get('/storage-tanks/production_tanks/'),
  create:          (data)   => api.post('/storage-tanks/', data),
  update:          (id, d)  => api.put(`/storage-tanks/${id}/`, d),
}

export const linesApi = {
  list:   () => api.get('/production-lines/'),
  create: (d) => api.post('/production-lines/', d),
  update: (id, d) => api.put(`/production-lines/${id}/`, d),
}

// ══════════════════════════════════════════════════════════════════════════════
// SAMPLES — Main
// ══════════════════════════════════════════════════════════════════════════════
export const samplesApi = {
  list:            (params)   => api.get('/samples/', { params: toParams(params) }),
  detail:          (id)       => api.get(`/samples/${id}/`),
  create:          (data)     => api.post('/samples/', data),
  update:          (id, d)    => api.put(`/samples/${id}/`, d),
  patch:           (id, d)    => api.patch(`/samples/${id}/`, d),
  delete:          (id)       => api.delete(`/samples/${id}/`),
  release:         (id)       => api.post(`/samples/${id}/release/`),
  checklist:       (id)       => api.get(`/samples/${id}/checklist/`),
  requestTransfer: (id)       => api.post(`/samples/${id}/request_transfer/`),
  approveTransfer: (id)       => api.post(`/samples/${id}/approve_transfer/`),

  // Nested: fat blend compositions
  listCompositions:   (samplePk)       => api.get(`/samples/${samplePk}/compositions/`),
  addComposition:     (samplePk, data) => api.post(`/samples/${samplePk}/compositions/`, data),
  deleteComposition:  (samplePk, id)   => api.delete(`/samples/${samplePk}/compositions/${id}/`),

  // Nested: finished product additives
  listAdditives:   (samplePk)       => api.get(`/samples/${samplePk}/additives/`),
  addAdditive:     (samplePk, data) => api.post(`/samples/${samplePk}/additives/`, data),
  deleteAdditive:  (samplePk, id)   => api.delete(`/samples/${samplePk}/additives/${id}/`),
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════
export const instrumentsApi = {
  list:          (params) => api.get('/instruments/', { params }),
  calibrationDue: ()      => api.get('/instruments/calibration_due/'),
  create:        (d)      => api.post('/instruments/', d),
  update:        (id, d)  => api.put(`/instruments/${id}/`, d),
}

export const methodsApi = {
  list:   (params) => api.get('/test-methods/', { params }),
  create: (d)      => api.post('/test-methods/', d),
  update: (id, d)  => api.put(`/test-methods/${id}/`, d),
}

export const parametersApi = {
  list:   (params) => api.get('/parameters/', { params: toParams(params) }),
  create: (d)      => api.post('/parameters/', d),
  update: (id, d)  => api.put(`/parameters/${id}/`, d),
  delete: (id)     => api.delete(`/parameters/${id}/`),
  byCategory: (categoryId) =>
    api.get('/parameters/', { params: { product_category: categoryId, is_active: true } }),
}

export const assignmentsApi = {
  list:    (params) => api.get('/assignments/', { params: toParams(params) }),
  detail:  (id)     => api.get(`/assignments/${id}/`),
  create:  (d)      => api.post('/assignments/', d),
  update:  (id, d)  => api.put(`/assignments/${id}/`, d),
  delete:  (id)     => api.delete(`/assignments/${id}/`),
  myTasks: ()       => api.get('/assignments/my_tasks/'),
}

export const resultsApi = {
  list:    (params) => api.get('/results/', { params: toParams(params) }),
  detail:  (id)     => api.get(`/results/${id}/`),
  update:  (id, d)  => api.put(`/results/${id}/`, d),
  submit:  (id, d)  => api.post(`/results/${id}/submit/`, d),
  approve: (id)     => api.post(`/results/${id}/approve/`),
  reject:  (id, d)  => api.post(`/results/${id}/reject/`, d),
  summary: (sampleId) => api.get(`/results/summary/${sampleId}/`),
}

export const checklistApi = {
  bySample: (sampleId) =>
    api.get('/checklists/', { params: { sample: sampleId } }),
}

// ══════════════════════════════════════════════════════════════════════════════
// SPECIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
export const specsApi = {
  list:               (params) => api.get('/specifications/', { params: toParams(params) }),
  detail:             (id)     => api.get(`/specifications/${id}/`),
  create:             (d)      => api.post('/specifications/', d),
  update:             (id, d)  => api.put(`/specifications/${id}/`, d),
  submitForApproval:  (id)     => api.post(`/specifications/${id}/submit_for_approval/`),
  approve:            (id)     => api.post(`/specifications/${id}/approve/`),
  reject:             (id, d)  => api.post(`/specifications/${id}/reject/`, d),
  revise:             (id)     => api.post(`/specifications/${id}/revise/`),
  active:             (categoryId) =>
    api.get('/specifications/active/', { params: { product_category: categoryId } }),

  // Nested limits
  listLimits:   (specId)       => api.get(`/specifications/${specId}/limits/`),
  createLimit:  (specId, d)    => api.post(`/specifications/${specId}/limits/`, d),
  updateLimit:  (specId, id, d)=> api.put(`/specifications/${specId}/limits/${id}/`, d),
  deleteLimit:  (specId, id)   => api.delete(`/specifications/${specId}/limits/${id}/`),
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPLAINTS
// ══════════════════════════════════════════════════════════════════════════════
export const complaintsApi = {
  list:          (params) => api.get('/complaints/', { params: toParams(params) }),
  detail:        (id)     => api.get(`/complaints/${id}/`),
  create:        (d)      => api.post('/complaints/', d),
  update:        (id, d)  => api.put(`/complaints/${id}/`, d),
  close:         (id)     => api.post(`/complaints/${id}/close/`),
  assign:        (id, d)  => api.post(`/complaints/${id}/assign/`, d),
  addAttachment: (id, formData) =>
    api.post(`/complaints/${id}/add_attachment/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Nested CAPA
  listCapas:  (complaintId)       => api.get(`/complaints/${complaintId}/capas/`),
  createCapa: (complaintId, d)    => api.post(`/complaints/${complaintId}/capas/`, d),
  updateCapa: (complaintId, id, d)=> api.put(`/complaints/${complaintId}/capas/${id}/`, d),
  verifyCapa: (complaintId, id, d)=> api.post(`/complaints/${complaintId}/capas/${id}/verify/`, d),
}

// ══════════════════════════════════════════════════════════════════════════════
// DOCUMENTS
// ══════════════════════════════════════════════════════════════════════════════
export const documentsApi = {
  list:               (params) => api.get('/documents/', { params: toParams(params) }),
  detail:             (id)     => api.get(`/documents/${id}/`),
  create:             (formData) =>
    api.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  submitForApproval:  (id)     => api.post(`/documents/${id}/submit_for_approval/`),
  approve:            (id)     => api.post(`/documents/${id}/approve/`),
  revise:             (id, fd) =>
    api.post(`/documents/${id}/revise/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  archive:            (id)     => api.post(`/documents/${id}/archive/`),
}

// ══════════════════════════════════════════════════════════════════════════════
// EXTERNAL REQUESTS & R&D
// ══════════════════════════════════════════════════════════════════════════════
export const externalApi = {
  list:      (params) => api.get('/external-analysis/', { params: toParams(params) }),
  detail:    (id)     => api.get(`/external-analysis/${id}/`),
  create:    (d)      => api.post('/external-analysis/', d),
  complete:  (id)     => api.post(`/external-analysis/${id}/complete/`),
  addResult: (id, d)  => api.post(`/external-analysis/${id}/add_result/`, d),
}

export const rndApi = {
  list:     (params) => api.get('/product-development/', { params: toParams(params) }),
  detail:   (id)     => api.get(`/product-development/${id}/`),
  create:   (d)      => api.post('/product-development/', d),
  addTrial: (id, d)  => api.post(`/product-development/${id}/add_trial/`, d),
  complete: (id, d)  => api.post(`/product-development/${id}/complete/`, d),
  trials:   (id)     => api.get(`/product-development/${id}/trials/`),
}

// ══════════════════════════════════════════════════════════════════════════════
// INVENTORY
// ══════════════════════════════════════════════════════════════════════════════
export const inventoryApi = {
  list:           (params) => api.get('/inventory/', { params: toParams(params) }),
  detail:         (id)     => api.get(`/inventory/${id}/`),
  create:         (d)      => api.post('/inventory/', d),
  update:         (id, d)  => api.put(`/inventory/${id}/`, d),
  lowStock:       ()       => api.get('/inventory/low_stock/'),
  expiryWarning:  ()       => api.get('/inventory/expiry_warning/'),
  addStock:       (id, d)  => api.post(`/inventory/${id}/add_stock/`, d),
  useStock:       (id, d)  => api.post(`/inventory/${id}/use_stock/`, d),
  movements:      (id)     => api.get(`/inventory/${id}/movements/`),
}

export const purchaseApi = {
  list:    (params) => api.get('/purchase-requests/', { params: toParams(params) }),
  create:  (d)      => api.post('/purchase-requests/', d),
  approve: (id)     => api.post(`/purchase-requests/${id}/approve/`),
  reject:  (id, d)  => api.post(`/purchase-requests/${id}/reject/`, d),
  ordered: (id)     => api.post(`/purchase-requests/${id}/ordered/`),
  receive: (id)     => api.post(`/purchase-requests/${id}/receive/`),
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS & AUDIT
// ══════════════════════════════════════════════════════════════════════════════
export const auditApi = {
  list:    (params) => api.get('/audit-log/', { params: toParams(params) }),
  detail:  (id)     => api.get(`/audit-log/${id}/`),
  summary: ()       => api.get('/audit-log/summary/'),
}

export const reportsApi = {
  templates:        (params) => api.get('/report-templates/', { params }),
  generatedReports: (params) => api.get('/generated-reports/', { params }),
}
