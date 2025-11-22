# Generated manually to fix AvaliacaoFase2 fields

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tccs', '0012_alter_eventotimeline_tipo_evento_and_more'),
    ]

    operations = [
        # Passo 1: Criar nova tabela com schema correto
        migrations.RunSQL(
            sql="""
                CREATE TABLE tccs_avaliacaofase2_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tcc_id BIGINT NOT NULL REFERENCES tccs_tcc(id) ON DELETE CASCADE,
                    avaliador_id BIGINT NOT NULL REFERENCES users_usuario(id) ON DELETE CASCADE,
                    nota_coerencia_conteudo DECIMAL(4, 2),
                    nota_qualidade_apresentacao DECIMAL(4, 2),
                    nota_dominio_tema DECIMAL(4, 2),
                    nota_clareza_fluencia DECIMAL(4, 2),
                    nota_observancia_tempo DECIMAL(4, 2),
                    parecer TEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
                    criado_em DATETIME NOT NULL,
                    atualizado_em DATETIME NOT NULL,
                    enviado_em DATETIME
                );

                -- Copiar dados da tabela antiga para a nova (renomeando as colunas)
                INSERT INTO tccs_avaliacaofase2_new (
                    id, tcc_id, avaliador_id,
                    nota_coerencia_conteudo,
                    nota_qualidade_apresentacao,
                    nota_dominio_tema,
                    nota_clareza_fluencia,
                    nota_observancia_tempo,
                    parecer,
                    status,
                    criado_em,
                    atualizado_em,
                    enviado_em
                )
                SELECT
                    id, tcc_id, avaliador_id,
                    nota_coerencia_conteudo,
                    nota_qualidade_material,  -- renomear
                    nota_dominio_tema,
                    nota_clareza_verbal,  -- renomear
                    nota_observancia_tempo,
                    NULL,  -- parecer não existia antes
                    status,
                    criado_em,
                    atualizado_em,
                    enviado_em
                FROM tccs_avaliacaofase2;

                -- Remover tabela antiga
                DROP TABLE tccs_avaliacaofase2;

                -- Renomear nova tabela
                ALTER TABLE tccs_avaliacaofase2_new RENAME TO tccs_avaliacaofase2;

                -- Recriar índices
                CREATE UNIQUE INDEX tccs_avaliacaofase2_tcc_id_avaliador_id_unique
                    ON tccs_avaliacaofase2(tcc_id, avaliador_id);
                CREATE INDEX tccs_avaliacaofase2_tcc_id_idx
                    ON tccs_avaliacaofase2(tcc_id);
                CREATE INDEX tccs_avaliacaofase2_avaliador_id_idx
                    ON tccs_avaliacaofase2(avaliador_id);
            """,
            reverse_sql="""
                -- Reverter não é trivial, então vamos apenas alertar
                SELECT 'Reverse migration not supported for this operation';
            """
        ),
    ]
