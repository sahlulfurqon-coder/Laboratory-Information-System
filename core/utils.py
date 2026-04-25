"""
core/utils.py
Utility functions untuk auto-generate kode sampel dan nomor referensi.
"""

import uuid
from datetime import date


def generate_storage_sample_id(tank_code: str, fill_date: date) -> str:
    """
    Generate kode sampel untuk raw material dari tangki utama (J2–J13).
    Format: {tank_code} {ddmmyy}
    Contoh: J3 180925
    """
    return f"{tank_code} {fill_date.strftime('%d%m%y')}"


def generate_production_sample_id(tank_code: str, sequence: int, fill_date: date) -> str:
    """
    Generate kode sampel untuk raw material dari tangki produksi (TA–TF).
    Format: {tank_code} {N}{ddmmyy}
    Contoh: TA 1180925 (pengisian ke-1, 18 Sept 2025)
    """
    return f"{tank_code} {sequence}{fill_date.strftime('%d%m%y')}"


def generate_fatblend_sample_id(production_date: date, line_code: str) -> str:
    """
    Generate kode sampel fat blend berdasarkan tanggal produksi dan line.
    Format: {ddmmyy}-{line_code}
    Contoh: 010126-A (1 Jan 2026, Line A)
    """
    return f"{production_date.strftime('%d%m%y')}-{line_code}"


def generate_complaint_number() -> str:
    """
    Generate nomor komplain unik.
    Format: COMP-{YYYY}-{NNNN}
    """
    from django.utils import timezone
    from apps.complaints.models import Complaint
    year = timezone.now().year
    count = Complaint.objects.filter(created_at__year=year).count() + 1
    return f"COMP-{year}-{count:04d}"


def generate_external_request_number() -> str:
    """
    Generate nomor permintaan analisis eksternal.
    Format: EXT-{YYYY}-{NNNN}
    """
    from django.utils import timezone
    from apps.external_requests.models import ExternalAnalysisRequest
    year = timezone.now().year
    count = ExternalAnalysisRequest.objects.filter(created_at__year=year).count() + 1
    return f"EXT-{year}-{count:04d}"


def generate_dev_request_number() -> str:
    """
    Generate nomor permintaan pengembangan produk.
    Format: RND-{YYYY}-{NNNN}
    """
    from django.utils import timezone
    from apps.external_requests.models import ProductDevelopmentRequest
    year = timezone.now().year
    count = ProductDevelopmentRequest.objects.filter(created_at__year=year).count() + 1
    return f"RND-{year}-{count:04d}"


def calculate_pass_fail(result_value, spec_min, spec_max) -> str:
    """
    Menghitung status pass/fail berdasarkan nilai hasil dan batas spesifikasi.
    Returns: 'pass', 'fail', atau 'na' (jika tidak ada spec)
    """
    if result_value is None:
        return 'na'
    if spec_min is not None and result_value < spec_min:
        return 'fail'
    if spec_max is not None and result_value > spec_max:
        return 'fail'
    if spec_min is None and spec_max is None:
        return 'na'
    return 'pass'
