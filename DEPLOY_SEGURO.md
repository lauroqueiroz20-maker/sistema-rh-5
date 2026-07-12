# Publicacao segura DINIZ RH

## Estrutura

- Hospedagem: Cloudflare Pages ou Vercel.
- Banco e login: Supabase.
- Dominio: `gestores.dinizrh.com.br`.
- Backup: GitHub privado.

## Variaveis de ambiente

Configure na hospedagem:

```env
VITE_SUPABASE_URL=https://mvbhenupgghvludwcboy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_6BaGDTWr2ynp0Xmk3ei6AQ_T7GgLi5H
```

## Supabase

1. Abrir SQL Editor.
2. Executar `supabase/schema.sql`.
3. Em Authentication, desativar confirmacao de e-mail para o primeiro uso.
4. Depois que Tatyana e gestores criarem senha, reativar se desejar.

## Acessos

- Tatyana: `https://gestores.dinizrh.com.br`
- Gestor 001: `https://gestores.dinizrh.com.br/?gestor=001`
- Gestor 002: `https://gestores.dinizrh.com.br/?gestor=002`

## Build

```bash
npm run build
```

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 22

## Backup

- Criar repositorio privado no GitHub.
- Subir o projeto antes de publicar.
- Publicar sempre a partir do GitHub.
- Para voltar versao, usar rollback da hospedagem.
