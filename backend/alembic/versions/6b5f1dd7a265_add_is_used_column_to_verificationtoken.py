"""add is_used column to VerificationToken

Revision ID: 6b5f1dd7a265
Revises: 16b6035a5059
Create Date: 2024-12-31 21:37:11.928702

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b5f1dd7a265'
down_revision: Union[str, None] = '16b6035a5059'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###