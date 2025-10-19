-- Migração: Inserção de dados iniciais
-- Data: 2025-01-24

-- Inserir usuários iniciais
INSERT INTO users (id, name, email, role, avatar_url, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'João Silva', 'joao.silva@empresa.com', 'admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Maria Santos', 'maria.santos@empresa.com', 'manager', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Pedro Costa', 'pedro.costa@empresa.com', 'user', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Ana Oliveira', 'ana.oliveira@empresa.com', 'user', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Carlos Ferreira', 'carlos.ferreira@empresa.com', 'user', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', NOW(), NOW());

-- Inserir clientes iniciais
INSERT INTO clients (id, name, email, phone, company, address, created_at, updated_at) VALUES
('c50e8400-e29b-41d4-a716-446655440001', 'TechCorp Ltda', 'contato@techcorp.com', '(11) 99999-0001', 'TechCorp Ltda', 'Av. Paulista, 1000 - São Paulo, SP', NOW(), NOW()),
('c50e8400-e29b-41d4-a716-446655440002', 'Inovação Digital', 'vendas@inovacaodigital.com', '(11) 99999-0002', 'Inovação Digital S.A.', 'Rua Augusta, 500 - São Paulo, SP', NOW(), NOW()),
('c50e8400-e29b-41d4-a716-446655440003', 'StartupXYZ', 'hello@startupxyz.com', '(11) 99999-0003', 'StartupXYZ', 'Vila Madalena, 200 - São Paulo, SP', NOW(), NOW()),
('c50e8400-e29b-41d4-a716-446655440004', 'Consultoria ABC', 'contato@consultoriaabc.com', '(11) 99999-0004', 'Consultoria ABC Ltda', 'Faria Lima, 1500 - São Paulo, SP', NOW(), NOW()),
('c50e8400-e29b-41d4-a716-446655440005', 'E-commerce Plus', 'suporte@ecommerceplus.com', '(11) 99999-0005', 'E-commerce Plus', 'Itaim Bibi, 800 - São Paulo, SP', NOW(), NOW());

-- Inserir algumas tarefas de exemplo
INSERT INTO tasks (
    id, title, description, status, priority, type, due_date, start_time, end_time,
    client_id, created_by, is_visible_to_all, tags, created_at, updated_at
) VALUES
(
    't50e8400-e29b-41d4-a716-446655440001',
    'Desenvolver landing page',
    'Criar uma landing page responsiva para o novo produto da TechCorp',
    'in_progress',
    'high',
    'development',
    '2025-02-15',
    '09:00',
    '18:00',
    'c50e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    true,
    '["frontend", "react", "responsivo"]',
    NOW(),
    NOW()
),
(
    't50e8400-e29b-41d4-a716-446655440002',
    'Reunião de planejamento',
    'Reunião para definir escopo do projeto de e-commerce',
    'pending',
    'medium',
    'meeting',
    '2025-01-30',
    '14:00',
    '16:00',
    'c50e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440002',
    false,
    '["planejamento", "escopo"]',
    NOW(),
    NOW()
),
(
    't50e8400-e29b-41d4-a716-446655440003',
    'Configurar ambiente de produção',
    'Configurar servidor e deploy automático para a StartupXYZ',
    'completed',
    'high',
    'devops',
    '2025-01-20',
    '08:00',
    '17:00',
    'c50e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003',
    true,
    '["devops", "deploy", "servidor"]',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days'
);

-- Inserir atribuições de tarefas
INSERT INTO task_assignments (task_id, user_id, assigned_at) VALUES
('t50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', NOW()),
('t50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', NOW()),
('t50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', NOW()),
('t50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', NOW()),
('t50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', NOW());

-- Inserir algumas subtarefas
INSERT INTO subtasks (id, task_id, title, description, is_completed, created_at, updated_at) VALUES
('s50e8400-e29b-41d4-a716-446655440001', 't50e8400-e29b-41d4-a716-446655440001', 'Criar wireframes', 'Desenhar wireframes da landing page', true, NOW(), NOW()),
('s50e8400-e29b-41d4-a716-446655440002', 't50e8400-e29b-41d4-a716-446655440001', 'Implementar header', 'Desenvolver componente de cabeçalho', true, NOW(), NOW()),
('s50e8400-e29b-41d4-a716-446655440003', 't50e8400-e29b-41d4-a716-446655440001', 'Implementar seção hero', 'Criar seção principal da landing page', false, NOW(), NOW()),
('s50e8400-e29b-41d4-a716-446655440004', 't50e8400-e29b-41d4-a716-446655440001', 'Testes responsivos', 'Testar em diferentes dispositivos', false, NOW(), NOW());

-- Inserir alguns comentários
INSERT INTO comments (id, task_id, author_id, content, created_at, updated_at) VALUES
('co50e8400-e29b-41d4-a716-446655440001', 't50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Wireframes aprovados pelo cliente. Iniciando desenvolvimento.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('co50e8400-e29b-41d4-a716-446655440002', 't50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Header implementado com sucesso. Seguindo para a próxima etapa.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('co50e8400-e29b-41d4-a716-446655440003', 't50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Reunião agendada para quinta-feira às 14h. Confirmar presença.', NOW(), NOW());