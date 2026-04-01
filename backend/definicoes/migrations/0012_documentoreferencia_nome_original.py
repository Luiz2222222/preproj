from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('definicoes', '0011_add_avaliacao_continuidade_inicio'),
    ]

    operations = [
        migrations.AddField(
            model_name='documentoreferencia',
            name='nome_original',
            field=models.CharField(blank=True, default='', max_length=255, verbose_name='Nome original do arquivo'),
        ),
    ]
