# API Endpoint Reference — LIS
## Base URL: `http://localhost:8000/api/`

---

## AUTH
| Method | URL | Keterangan |
|--------|-----|------------|
| POST | `/api/auth/login/` | Login → dapat access + refresh token |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/verify/` | Verifikasi token masih valid |

**Body login:**
```json
{ "username": "admin", "password": "password123" }
```
**Response:** `{ "access": "eyJ...", "refresh": "eyJ..." }`

Semua request berikutnya wajib kirim header:
```
Authorization: Bearer {access_token}
```

---

## ACCOUNTS `/api/users/`
| Method | URL | Role | Keterangan |
|--------|-----|------|------------|
| GET | `/api/users/` | Admin, QA | List semua user |
| POST | `/api/users/` | Admin | Buat user baru |
| GET | `/api/users/{id}/` | Auth | Detail user |
| PUT/PATCH | `/api/users/{id}/` | Auth | Update user |
| DELETE | `/api/users/{id}/` | Admin | Hapus user |
| GET/PUT/PATCH | `/api/users/me/` | Auth | Profil sendiri |
| POST | `/api/users/me/change_password/` | Auth | Ganti password |
| PATCH | `/api/users/{id}/set_role/` | Admin | Ganti role/status |

---

## SAMPLES

### Master Data
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/sample-types/` | List tipe sampel |
| GET/POST/PUT/DELETE | `/api/product-categories/` | CRUD kategori produk |
| GET | `/api/product-categories/?sample_type={uuid}` | Filter per tipe |
| GET/POST/PUT/DELETE | `/api/storage-tanks/` | CRUD tangki |
| GET | `/api/storage-tanks/storage_tanks/` | Hanya tangki utama (J) |
| GET | `/api/storage-tanks/production_tanks/` | Hanya tangki produksi (T) |
| GET/POST/PUT/DELETE | `/api/production-lines/` | CRUD line produksi |

### Sampel
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/samples/` | List sampel |
| GET | `/api/samples/?status=registered` | Filter by status |
| GET | `/api/samples/?urgency=urgent` | Filter by urgensi |
| GET | `/api/samples/?sample_type={uuid}` | Filter by tipe |
| GET | `/api/samples/?registered_from=2025-01-01&registered_to=2025-12-31` | Filter by tanggal |
| GET | `/api/samples/?search=J3` | Cari by sample_id/nama/WO |
| POST | `/api/samples/` | Registrasi sampel baru |
| GET | `/api/samples/{id}/` | Detail sampel (+ nested detail per tipe) |
| PUT/PATCH | `/api/samples/{id}/` | Update sampel |
| DELETE | `/api/samples/{id}/` | Hapus sampel |
| POST | `/api/samples/{id}/release/` | Rilis sampel (QA) |
| GET | `/api/samples/{id}/checklist/` | Checklist parameter |
| POST | `/api/samples/{id}/request_transfer/` | Minta transfer tangki |
| POST | `/api/samples/{id}/approve_transfer/` | Setujui transfer (QA) |

### Nested — Fat Blend Composition
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/samples/{sample_pk}/compositions/` | List komposisi minyak |
| POST | `/api/samples/{sample_pk}/compositions/` | Tambah komposisi |
| PUT/DELETE | `/api/samples/{sample_pk}/compositions/{id}/` | Edit/hapus |

### Nested — Finished Product Additives
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/samples/{sample_pk}/additives/` | List additive |
| POST | `/api/samples/{sample_pk}/additives/` | Tambah additive |
| PUT/DELETE | `/api/samples/{sample_pk}/additives/{id}/` | Edit/hapus |

---

## ANALYSIS

### Master Data
| Method | URL | Keterangan |
|--------|-----|------------|
| GET/POST/PUT/DELETE | `/api/instruments/` | CRUD instrumen |
| GET | `/api/instruments/calibration_due/` | Instrumen kalibrasi habis |
| GET/POST/PUT/DELETE | `/api/test-methods/` | CRUD metode uji |
| GET/POST/PUT/DELETE | `/api/parameters/` | CRUD parameter uji |
| GET | `/api/parameters/?product_category={uuid}` | Parameter per produk |

### Workflow
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/assignments/` | List penugasan |
| POST | `/api/assignments/` | Assign sampel ke analis |
| GET | `/api/assignments/?analyst={id}` | Tugas analis tertentu |
| GET | `/api/assignments/?sample={id}` | Tugas untuk satu sampel |
| GET | `/api/assignments/my_tasks/` | Tugas milik user login |
| GET | `/api/results/` | List hasil analisis |
| GET | `/api/results/?assignment={id}` | Hasil per penugasan |
| GET | `/api/results/?status=submitted` | Filter by status |
| POST | `/api/results/{id}/submit/` | Submit hasil (analis) |
| POST | `/api/results/{id}/approve/` | Approve hasil (QA) |
| POST | `/api/results/{id}/reject/` | Reject hasil (QA) |
| GET | `/api/results/summary/{sample_id}/` | Ringkasan pass/fail per sampel |
| GET | `/api/checklists/?sample={id}` | Checklist per sampel |

---

## SPECIFICATIONS
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/specifications/` | List semua versi spesifikasi |
| GET | `/api/specifications/?status=active` | Hanya yang aktif |
| GET | `/api/specifications/?product_category={uuid}` | Per produk |
| POST | `/api/specifications/` | Buat spesifikasi baru (draft) |
| GET | `/api/specifications/{id}/` | Detail + semua limit |
| POST | `/api/specifications/{id}/submit_for_approval/` | Ajukan ke QA |
| POST | `/api/specifications/{id}/approve/` | QA setujui |
| POST | `/api/specifications/{id}/reject/` | QA tolak |
| POST | `/api/specifications/{id}/revise/` | Buat versi baru |
| GET | `/api/specifications/active/?product_category={uuid}` | Spec aktif per produk |

### Nested — Limits
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/specifications/{spec_pk}/limits/` | List semua batas parameter |
| POST | `/api/specifications/{spec_pk}/limits/` | Tambah batas parameter |
| PUT/DELETE | `/api/specifications/{spec_pk}/limits/{id}/` | Edit/hapus |

---

## COMPLAINTS
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/complaints/` | List komplain |
| GET | `/api/complaints/?status=open` | Filter by status |
| GET | `/api/complaints/?priority=critical` | Filter by prioritas |
| POST | `/api/complaints/` | Input komplain baru |
| GET | `/api/complaints/{id}/` | Detail + lampiran + CAPA |
| POST | `/api/complaints/{id}/close/` | Tutup komplain (QA) |
| POST | `/api/complaints/{id}/assign/` | Assign PIC (QA) |
| POST | `/api/complaints/{id}/add_attachment/` | Upload lampiran |

### Nested — CAPA
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/complaints/{complaint_pk}/capas/` | List CAPA |
| POST | `/api/complaints/{complaint_pk}/capas/` | Tambah CAPA |
| PUT/PATCH | `/api/complaints/{complaint_pk}/capas/{id}/` | Update CAPA |
| POST | `/api/complaints/{complaint_pk}/capas/{id}/verify/` | Verifikasi CAPA (QA) |

---

## DOCUMENTS
| Method | URL | Keterangan |
|--------|-----|------------|
| GET/POST/PUT/DELETE | `/api/document-categories/` | CRUD kategori dokumen |
| GET | `/api/documents/` | List dokumen |
| GET | `/api/documents/?category={id}&status=active` | Filter |
| POST | `/api/documents/` | Upload dokumen baru (multipart) |
| GET | `/api/documents/{id}/` | Detail + riwayat revisi |
| POST | `/api/documents/{id}/submit_for_approval/` | Ajukan ke QA |
| POST | `/api/documents/{id}/approve/` | QA setujui |
| POST | `/api/documents/{id}/revise/` | Upload versi baru |
| POST | `/api/documents/{id}/archive/` | Arsipkan dokumen |

---

## EXTERNAL REQUESTS & R&D

### Analisis Eksternal
| Method | URL | Keterangan |
|--------|-----|------------|
| GET/POST | `/api/external-analysis/` | List / buat permintaan |
| GET | `/api/external-analysis/{id}/` | Detail + hasil |
| POST | `/api/external-analysis/{id}/complete/` | Tandai selesai |
| POST | `/api/external-analysis/{id}/add_result/` | Input hasil manual |

### Pengembangan Produk (R&D)
| Method | URL | Keterangan |
|--------|-----|------------|
| GET/POST | `/api/product-development/` | List / buat project R&D |
| GET | `/api/product-development/{id}/` | Detail + semua trial |
| POST | `/api/product-development/{id}/add_trial/` | Tambah trial baru |
| POST | `/api/product-development/{id}/complete/` | Tandai selesai |
| GET | `/api/product-development/{id}/trials/` | List trial saja |

---

## INVENTORY
| Method | URL | Keterangan |
|--------|-----|------------|
| GET/POST/PUT/DELETE | `/api/item-categories/` | CRUD kategori item |
| GET | `/api/inventory/` | List semua item + stok |
| GET | `/api/inventory/?category={id}` | Filter per kategori |
| GET | `/api/inventory/?low_stock=true` | Item stok < 20% |
| GET | `/api/inventory/?expiry_warning=true` | Item hampir kadaluarsa |
| POST | `/api/inventory/` | Tambah item baru |
| GET | `/api/inventory/{id}/` | Detail item |
| GET | `/api/inventory/low_stock/` | Daftar item stok rendah |
| GET | `/api/inventory/expiry_warning/` | Daftar item hampir expired |
| POST | `/api/inventory/{id}/add_stock/` | Catat penerimaan stok |
| POST | `/api/inventory/{id}/use_stock/` | Catat pemakaian stok |
| GET | `/api/inventory/{id}/movements/` | Riwayat pergerakan stok |
| GET/POST | `/api/purchase-requests/` | List / buat PR |
| GET | `/api/purchase-requests/?status=pending` | Filter PR |
| POST | `/api/purchase-requests/{id}/approve/` | Setujui PR (QA) |
| POST | `/api/purchase-requests/{id}/reject/` | Tolak PR (QA) |
| POST | `/api/purchase-requests/{id}/ordered/` | Tandai sudah dipesan |
| POST | `/api/purchase-requests/{id}/receive/` | Tandai sudah diterima |

---

## REPORTS & AUDIT
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/audit-log/` | List audit log (Admin, QA) |
| GET | `/api/audit-log/?user={id}&action=update` | Filter log |
| GET | `/api/audit-log/?model_name=Sample` | Filter per model |
| GET | `/api/audit-log/?date_from=2025-01-01` | Filter per tanggal |
| GET | `/api/audit-log/{id}/` | Detail log entry |
| GET | `/api/audit-log/summary/` | Ringkasan aktivitas hari ini |
| GET/POST/PUT/DELETE | `/api/report-templates/` | CRUD template laporan |
| GET | `/api/generated-reports/` | Riwayat laporan yang di-generate |

---

## QUERY PARAMETER UMUM
| Parameter | Keterangan | Contoh |
|-----------|------------|--------|
| `search` | Pencarian teks | `?search=J3+180925` |
| `page` | Nomor halaman | `?page=2` |
| `page_size` | Jumlah per halaman (max 200) | `?page_size=50` |
| `ordering` | Urutkan asc/desc | `?ordering=-registered_at` |

## TAMBAHAN PACKAGE YANG DIBUTUHKAN

Tambahkan ke `requirements.txt`:
```
drf-nested-routers>=0.94    # Untuk nested URL (/samples/{pk}/compositions/)
```

Install:
```bash
pip install drf-nested-routers
```
