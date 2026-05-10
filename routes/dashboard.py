from flask import Blueprint, render_template, jsonify
from models.user import User
from models.attendance import AttendanceRecord
from extensions import db

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/')
def index():
    total_users = User.query.count()
    total_attendances = AttendanceRecord.query.count()
    return render_template(
        'dashboard.html',
        total_users=total_users,
        total_attendances=total_attendances
    )


@dashboard_bp.route('/health')
def health_check():
    # Dipakai Railway untuk ngecek apakah service sudah hidup
    try:
        db.session.execute(db.text('SELECT 1'))
        return jsonify({
            "status": "healthy",
            "message": "App is running",
            "database": "connected"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "message": str(e),
            "database": "disconnected"
        }), 500


@dashboard_bp.route('/api/statistics')
def get_statistics():
    try:
        total_users = User.query.count()
        total_attendances = AttendanceRecord.query.count()

        hadir_count = AttendanceRecord.query.filter_by(status='Hadir').count()
        izin_count  = AttendanceRecord.query.filter_by(status='Izin').count()
        sakit_count = AttendanceRecord.query.filter_by(status='Sakit').count()
        alpa_count  = AttendanceRecord.query.filter_by(status='Alpa').count()

        attendance_rate = 0
        if total_attendances > 0:
            attendance_rate = round((hadir_count / total_attendances) * 100, 2)

        return jsonify({
            "success": True,
            "data": {
                "total_users": total_users,
                "total_records": total_attendances,
                "status_breakdown": {
                    "hadir": hadir_count,
                    "izin": izin_count,
                    "sakit": sakit_count,
                    "alpa": alpa_count
                },
                "attendance_rate_percentage": attendance_rate
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
