"""
Actua como un indice centralizado que recolecta y empaqueta todos los esquemas 
(user, audit, report) en un solo lugar. Asi, la aplicacion puede importar 
todo desde aqui sin buscar archivo por archivo
"""

from .user import UserCreate, UserLogin, UserRead
from .audit import AuditCreate, AuditRead
from .report import ReportRead

# Lista de todos los esquemas que se exportan
__all__ = ["UserCreate", "UserLogin", "UserRead", "AuditCreate", "AuditRead", "ReportRead"]

