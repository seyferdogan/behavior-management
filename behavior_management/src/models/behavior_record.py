from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .user import Base

class BehaviorRecord(Base):
    __tablename__ = 'behavior_records'

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    recorded_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    behavior_type = Column(String(50), nullable=False)  # 'positive' or 'negative'
    description = Column(Text, nullable=False)
    points = Column(Integer, default=0)  # positive or negative points
    
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    recorded_by = relationship("User", foreign_keys=[recorded_by_id])

    def __repr__(self):
        return f"<BehaviorRecord(student_id={self.student_id}, type='{self.behavior_type}', points={self.points})>" 