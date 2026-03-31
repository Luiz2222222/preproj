# Generated manually to fix schema mismatch

from django.db import migrations


def rename_columns_forward(apps, schema_editor):
    """Rename columns in the database"""
    with schema_editor.connection.cursor() as cursor:
        # Check if old columns exist using information_schema (PostgreSQL compatible)
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name='definicoes_calendariosemestre'
        """)
        columns = [row[0] for row in cursor.fetchall()]

        if 'peso_clareza_verbal' in columns:
            cursor.execute("""
                ALTER TABLE definicoes_calendariosemestre
                RENAME COLUMN peso_clareza_verbal TO peso_clareza_fluencia
            """)

        if 'peso_qualidade_material' in columns:
            cursor.execute("""
                ALTER TABLE definicoes_calendariosemestre
                RENAME COLUMN peso_qualidade_material TO peso_qualidade_apresentacao
            """)


def rename_columns_backward(apps, schema_editor):
    """Reverse the rename operation"""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            ALTER TABLE definicoes_calendariosemestre
            RENAME COLUMN peso_clareza_fluencia TO peso_clareza_verbal
        """)
        cursor.execute("""
            ALTER TABLE definicoes_calendariosemestre
            RENAME COLUMN peso_qualidade_apresentacao TO peso_qualidade_material
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('definicoes', '0004_calendariosemestre_peso_conclusoes_and_more'),
    ]

    operations = [
        migrations.RunPython(rename_columns_forward, rename_columns_backward),
    ]
