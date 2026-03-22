"""
Actua como un indice centralizado que recolecta y empaqueta todos los modelos 
(user, audit, report) en un solo lugar. Asi, la aplicacion puede importar 
todo desde aqui sin buscar archivo por archivo
"""

from .user import User
from .audit import Audit, LanguageEnum, AuditStatusEnum
from .report import Report

# Lista de todos los modelos que se exportan
__all__ = ["User", "Audit", "LanguageEnum", "AuditStatusEnum", "Report"]

