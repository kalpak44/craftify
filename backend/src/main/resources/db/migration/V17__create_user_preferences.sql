create table if not exists user_preferences (
    id uuid primary key,
    owner_sub varchar(191) not null unique,
    locale varchar(16) not null,
    theme varchar(16) not null,
    onboarding_completed boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    version bigint not null default 0
);
