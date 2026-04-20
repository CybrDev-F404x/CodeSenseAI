"""Migración inicial: crea las tablas users, audits y reports.

Revision ID: c1da80205aa8
Revises: 
Create Date: 2026-02-25 13:36:24.280383
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c1da80205aa8'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # ── audits ───────────────────────────────────────────────────────────────
    language_enum = postgresql.ENUM("python", "csharp", name="languageenum", create_type=True)
    status_enum = postgresql.ENUM(
        "pending", "processing", "done", "failed",
        name="auditstatusenum",
        create_type=True,
    )
    language_enum.create(op.get_bind(), checkfirst=True)
    status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "audits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("language", sa.Enum("python", "csharp", name="languageenum"), nullable=False),
        sa.Column("code_snippet", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "processing", "done", "failed", name="auditstatusenum"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_audits_user_id", "audits", ["user_id"])

    # ── reports ──────────────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "audit_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("audits.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("findings", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_reports_audit_id", "reports", ["audit_id"])


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("audits")
    op.drop_table("users")
    sa.Enum(name="auditstatusenum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="languageenum").drop(op.get_bind(), checkfirst=True)
