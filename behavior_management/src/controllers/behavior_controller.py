from ..models.behavior_record import BehaviorRecord
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

class BehaviorController:
    def record_behavior(self, db: Session, student_id: int, recorded_by_id: int,
                       behavior_type: str, description: str, points: int) -> BehaviorRecord:
        behavior = BehaviorRecord(
            student_id=student_id,
            recorded_by_id=recorded_by_id,
            behavior_type=behavior_type,
            description=description,
            points=points,
            timestamp=datetime.utcnow()
        )
        db.add(behavior)
        db.commit()
        db.refresh(behavior)
        return behavior

    def get_student_behaviors(self, db: Session, student_id: int,
                            start_date: Optional[datetime] = None,
                            end_date: Optional[datetime] = None) -> List[BehaviorRecord]:
        query = db.query(BehaviorRecord).filter(BehaviorRecord.student_id == student_id)
        
        if start_date:
            query = query.filter(BehaviorRecord.timestamp >= start_date)
        if end_date:
            query = query.filter(BehaviorRecord.timestamp <= end_date)
            
        return query.order_by(BehaviorRecord.timestamp.desc()).all()

    def get_student_points(self, db: Session, student_id: int,
                         start_date: Optional[datetime] = None,
                         end_date: Optional[datetime] = None) -> int:
        behaviors = self.get_student_behaviors(db, student_id, start_date, end_date)
        return sum(behavior.points for behavior in behaviors)

    def update_behavior_record(self, db: Session, record_id: int,
                             description: Optional[str] = None,
                             points: Optional[int] = None) -> Optional[BehaviorRecord]:
        record = db.query(BehaviorRecord).filter(BehaviorRecord.id == record_id).first()
        if record:
            if description:
                record.description = description
            if points is not None:
                record.points = points
            db.commit()
            db.refresh(record)
        return record 