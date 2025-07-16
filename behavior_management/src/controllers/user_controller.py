from ..models.user import User
from sqlalchemy.orm import Session
from typing import List, Optional

class UserController:
    def create_user(self, db: Session, username: str, email: str, role: str,
                   first_name: Optional[str] = None, last_name: Optional[str] = None) -> User:
        user = User(
            username=username,
            email=email,
            role=role,
            first_name=first_name,
            last_name=last_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def get_user(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    def update_user(self, db: Session, user_id: int, **kwargs) -> Optional[User]:
        user = self.get_user(db, user_id)
        if user:
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            db.commit()
            db.refresh(user)
        return user

    def delete_user(self, db: Session, user_id: int) -> bool:
        user = self.get_user(db, user_id)
        if user:
            db.delete(user)
            db.commit()
            return True
        return False 