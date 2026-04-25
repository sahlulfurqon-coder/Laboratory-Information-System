"""
apps/accounts/serializers.py
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, UserActivityLog


class UserListSerializer(serializers.ModelSerializer):
    """Serializer ringkas untuk list/dropdown."""
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'role', 'employee_id',
                  'department', 'is_active']


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer lengkap untuk detail & update profil."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 'role_display',
            'employee_id', 'department', 'phone', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer khusus untuk admin buat akun baru."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'full_name', 'password', 'password_confirm',
            'role', 'employee_id', 'department', 'phone',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Password tidak cocok.'})
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            role=validated_data.get('role', User.Role.ANALYST),
            employee_id=validated_data.get('employee_id', ''),
            department=validated_data.get('department', ''),
            phone=validated_data.get('phone', ''),
            created_by=request.user if request else None,
        )
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Password tidak cocok.'})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Password lama salah.')
        return value


class UserActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivityLog
        fields = ['id', 'user', 'action', 'ip_address', 'timestamp']
