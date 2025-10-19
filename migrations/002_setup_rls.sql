-- Migração: Configuração de Row Level Security (RLS)
-- Data: 2025-01-24

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela users
-- Usuários podem ver todos os outros usuários (para atribuições)
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Apenas admins podem inserir novos usuários
CREATE POLICY "Only admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Políticas para a tabela clients
-- Usuários autenticados podem ver todos os clientes
CREATE POLICY "Authenticated users can view clients" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

-- Usuários autenticados podem inserir clientes
CREATE POLICY "Authenticated users can insert clients" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Usuários autenticados podem atualizar clientes
CREATE POLICY "Authenticated users can update clients" ON clients
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Apenas admins podem deletar clientes
CREATE POLICY "Only admins can delete clients" ON clients
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Políticas para a tabela tasks
-- Usuários podem ver tarefas que são visíveis para todos OU tarefas atribuídas a eles OU tarefas criadas por eles
CREATE POLICY "Users can view relevant tasks" ON tasks
    FOR SELECT USING (
        is_visible_to_all = true 
        OR created_by::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM task_assignments 
            WHERE task_id = tasks.id 
            AND user_id::text = auth.uid()::text
        )
    );

-- Usuários autenticados podem inserir tarefas
CREATE POLICY "Authenticated users can insert tasks" ON tasks
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND created_by::text = auth.uid()::text
    );

-- Usuários podem atualizar tarefas que criaram OU que estão atribuídas a eles
CREATE POLICY "Users can update relevant tasks" ON tasks
    FOR UPDATE USING (
        created_by::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM task_assignments 
            WHERE task_id = tasks.id 
            AND user_id::text = auth.uid()::text
        )
    );

-- Apenas criadores ou admins podem deletar tarefas
CREATE POLICY "Creators and admins can delete tasks" ON tasks
    FOR DELETE USING (
        created_by::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Políticas para task_assignments
-- Usuários podem ver atribuições de tarefas que podem ver
CREATE POLICY "Users can view task assignments" ON task_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE id = task_assignments.task_id
            AND (
                is_visible_to_all = true 
                OR created_by::text = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta2
                    WHERE ta2.task_id = tasks.id 
                    AND ta2.user_id::text = auth.uid()::text
                )
            )
        )
    );

-- Criadores de tarefas podem inserir/atualizar/deletar atribuições
CREATE POLICY "Task creators can manage assignments" ON task_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE id = task_assignments.task_id 
            AND created_by::text = auth.uid()::text
        )
    );

-- Políticas para subtasks
-- Usuários podem ver subtarefas de tarefas que podem ver
CREATE POLICY "Users can view subtasks" ON subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE id = subtasks.task_id
            AND (
                is_visible_to_all = true 
                OR created_by::text = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM task_assignments 
                    WHERE task_id = tasks.id 
                    AND user_id::text = auth.uid()::text
                )
            )
        )
    );

-- Usuários podem inserir/atualizar subtarefas em tarefas relevantes
CREATE POLICY "Users can manage subtasks" ON subtasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE id = subtasks.task_id
            AND (
                created_by::text = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM task_assignments 
                    WHERE task_id = tasks.id 
                    AND user_id::text = auth.uid()::text
                )
            )
        )
    );

-- Políticas para comments
-- Usuários podem ver comentários de tarefas/subtarefas que podem ver
CREATE POLICY "Users can view comments" ON comments
    FOR SELECT USING (
        (task_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM tasks 
            WHERE id = comments.task_id
            AND (
                is_visible_to_all = true 
                OR created_by::text = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM task_assignments 
                    WHERE task_id = tasks.id 
                    AND user_id::text = auth.uid()::text
                )
            )
        ))
        OR
        (subtask_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM subtasks s
            JOIN tasks t ON s.task_id = t.id
            WHERE s.id = comments.subtask_id
            AND (
                t.is_visible_to_all = true 
                OR t.created_by::text = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM task_assignments 
                    WHERE task_id = t.id 
                    AND user_id::text = auth.uid()::text
                )
            )
        ))
    );

-- Usuários autenticados podem inserir comentários
CREATE POLICY "Authenticated users can insert comments" ON comments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND author_id::text = auth.uid()::text
    );

-- Usuários podem atualizar apenas seus próprios comentários
CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (author_id::text = auth.uid()::text);

-- Usuários podem deletar apenas seus próprios comentários OU admins podem deletar qualquer comentário
CREATE POLICY "Users can delete own comments or admins can delete any" ON comments
    FOR DELETE USING (
        author_id::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Políticas para attachments
-- Usuários podem ver anexos de tarefas que podem ver
CREATE POLICY "Users can view attachments" ON attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE id = attachments.task_id
            AND (
                is_visible_to_all = true 
                OR created_by::text = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM task_assignments 
                    WHERE task_id = tasks.id 
                    AND user_id::text = auth.uid()::text
                )
            )
        )
    );

-- Usuários podem inserir anexos em tarefas relevantes
CREATE POLICY "Users can insert attachments" ON attachments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND uploaded_by::text = auth.uid()::text
        AND EXISTS (
            SELECT 1 FROM tasks 
            WHERE id = attachments.task_id
            AND (
                created_by::text = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM task_assignments 
                    WHERE task_id = tasks.id 
                    AND user_id::text = auth.uid()::text
                )
            )
        )
    );

-- Usuários podem deletar apenas anexos que enviaram OU admins podem deletar qualquer anexo
CREATE POLICY "Users can delete own attachments or admins can delete any" ON attachments
    FOR DELETE USING (
        uploaded_by::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );