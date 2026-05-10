from flask import Blueprint, request, jsonify
from models.attendance import AttendanceRecord
from models.user import User
from extensions import db
from datetime import datetime

attendance_bp = Blueprint('attendance', __name__)


@attendance_bp.route('/attendance', methods=['GET'])
def get_attendance():
    date_filter   = request.args.get('date')
    user_id_filter = request.args.get('user_id')

    try:
        query = AttendanceRecord.query

        if date_filter:
            # format: YYYY-MM-DD
            query = query.filter_by(date=datetime.strptime(date_filter, '%Y-%m-%d').date())

        if user_id_filter:
            query = query.filter_by(user_id=user_id_filter)

        records = query.order_by(AttendanceRecord.created_at.desc()).all()

        return jsonify({
            "success": True,
            "count": len(records),
            "data": [record.to_dict() for record in records]
        }), 200

    except ValueError:
        return jsonify({
            "success": False,
            "message": "Format tanggal salah. Gunakan YYYY-MM-DD."
        }), 400

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@attendance_bp.route('/attendance', methods=['POST'])
def create_attendance():
    data = request.get_json()

    if not data or not data.get('user_id') or not data.get('status'):
        return jsonify({
            "success": False,
            "message": "user_id dan status wajib diisi."
        }), 400

    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({"success": False, "message": "User tidak ditemukan."}), 404

    try:
        new_record = AttendanceRecord(
            user_id=data['user_id'],
            status=data['status'],
            activity_summary=data.get('activity_summary', '')
        )
        db.session.add(new_record)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Kehadiran berhasil dicatat.",
            "data": new_record.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
