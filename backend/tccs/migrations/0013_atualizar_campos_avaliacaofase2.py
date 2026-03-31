# Generated manually to fix AvaliacaoFase2 fields

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def migrate_forward(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        # Check which columns currently exist
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name='tccs_avaliacaofase2'
        """)
        columns = [row[0] for row in cursor.fetchall()]

        # If table already has new column names, nothing to do
        if 'nota_qualidade_apresentacao' in columns and 'nota_clareza_fluencia' in columns:
            # Just ensure parecer column exists
            if 'parecer' not in columns:
                cursor.execute("""
                    ALTER TABLE tccs_avaliacaofase2 ADD COLUMN parecer TEXT
                """)
            return

        # Old database: need to rename columns and add parecer
        if 'nota_qualidade_material' in columns:
            cursor.execute("""
                ALTER TABLE tccs_avaliacaofase2
                RENAME COLUMN nota_qualidade_material TO nota_qualidade_apresentacao
            """)

        if 'nota_clareza_verbal' in columns:
            cursor.execute("""
                ALTER TABLE tccs_avaliacaofase2
                RENAME COLUMN nota_clareza_verbal TO nota_clareza_fluencia
            """)

        if 'parecer' not in columns:
            cursor.execute("""
                ALTER TABLE tccs_avaliacaofase2 ADD COLUMN parecer TEXT
            """)


def migrate_backward(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name='tccs_avaliacaofase2'
        """)
        columns = [row[0] for row in cursor.fetchall()]

        if 'nota_qualidade_apresentacao' in columns:
            cursor.execute("""
                ALTER TABLE tccs_avaliacaofase2
                RENAME COLUMN nota_qualidade_apresentacao TO nota_qualidade_material
            """)

        if 'nota_clareza_fluencia' in columns:
            cursor.execute("""
                ALTER TABLE tccs_avaliacaofase2
                RENAME COLUMN nota_clareza_fluencia TO nota_clareza_verbal
            """)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tccs', '0012_alter_eventotimeline_tipo_evento_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_forward, migrate_backward),
    ]
