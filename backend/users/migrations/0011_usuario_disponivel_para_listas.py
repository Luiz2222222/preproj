from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_alter_usuario_departamento'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='disponivel_para_listas',
            field=models.BooleanField(default=True, verbose_name='Disponível para seleção em listas'),
        ),
    ]
