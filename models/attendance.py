from datetime import datetime
from extensions import db


class AttendanceRecord(db.Model):
    __tablename__ = 'attendance_records'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    time_in = db.Column(db.Time, nullable=False, default=datetime.utcnow().time)
    status = db.Column(db.String(20), nullable=False)  # Hadir / Izin / Sakit / Alpa
    activity_summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'time_in': self.time_in.isoformat() if self.time_in else None,
            'status': self.status,
            'activity_summary': self.activity_summary,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user_name': self.user.name if self.user else 'Unknown'
        }

    def __repr__(self):
        return f'<Attendance {self.date} - User {self.user_id}>'
