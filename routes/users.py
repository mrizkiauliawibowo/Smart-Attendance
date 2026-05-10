from flask import Blueprint, request, jsonify
from models.user import User
from extensions import db
from sqlalchemy.exc import IntegrityError

users_bp = Blueprint('users', __name__)


@users_bp.route('/users', methods=['GET'])
def get_users():
    role_filter = request.args.get('role')
    try:
        if role_filter:
            users = User.query.filter_by(role=role_filter).all()
        else:
            users = User.query.all()

        return jsonify({
            "success": True,
            "count": len(users),
            "data": [user.to_dict() for user in users]
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@users_bp.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()

    if not data or not data.get('name') or not data.get('email'):
        return jsonify({
            "success": False,
            "message": "Nama dan email wajib diisi."
        }), 400

    try:
        new_user = User(
            name=data['name'],
            email=data['email'],
            role=data.get('role', 'mahasiswa')
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Pengguna berhasil didaftarkan.",
            "data": new_user.to_dict()
        }), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"success": False, "message": "Email sudah terdaftar."}), 409

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
