-- Script para criar o primeiro usuário Administrador no sistema

-- 1. Cria o perfil de Admin
INSERT INTO Perfis (Nome, Descricao) VALUES ('Admin', 'Acesso total ao sistema corporativo');

-- 2. Pega o ID do perfil recém criado
DECLARE @AdminPerfilID INT;
SET @AdminPerfilID = SCOPE_IDENTITY();

-- 3. Cria uma permissão coringa (ou você pode cadastrar manualmente as permissões depois)
INSERT INTO Permissoes (Chave, Descricao) VALUES ('*', 'Acesso mestre a todos os recursos');
DECLARE @PermissaoMasterID INT;
SET @PermissaoMasterID = SCOPE_IDENTITY();

-- 4. Vincula a permissão ao perfil
INSERT INTO Perfil_Permissao (ID_Perfil, ID_Permissao) VALUES (@AdminPerfilID, @PermissaoMasterID);

-- 5. Cria o usuário com a senha "admin123"
-- O hash bcrypt de "admin123" é: $2b$10$WRpo1db9r38F/OeDT/DXbOqLxbrENvZkc0GwcBv0iHijBCH3czLiC
INSERT INTO Usuarios (Nome, Login, SenhaHash, ID_Perfil, Ativo) 
VALUES ('Administrador Master', 'admin', '$2b$10$WRpo1db9r38F/OeDT/DXbOqLxbrENvZkc0GwcBv0iHijBCH3czLiC', @AdminPerfilID, 1);

PRINT 'Usuário admin criado com sucesso! Login: admin / Senha: admin123';
