-- Script pour ajouter les nouveaux types d'événements de sécurité
-- Ajoute les valeurs manquantes à l'enum security_event_type

-- Ajouter les nouveaux types d'événements
ALTER TYPE security_event_type ADD VALUE IF NOT EXISTS 'mfa_setup_initiated';
ALTER TYPE security_event_type ADD VALUE IF NOT EXISTS 'mfa_backup_codes_regenerated';
ALTER TYPE security_event_type ADD VALUE IF NOT EXISTS 'security_settings_updated';
ALTER TYPE security_event_type ADD VALUE IF NOT EXISTS 'session_revoked';
ALTER TYPE security_event_type ADD VALUE IF NOT EXISTS 'all_sessions_revoked';
ALTER TYPE security_event_type ADD VALUE IF NOT EXISTS 'session_metadata_updated';
ALTER TYPE security_event_type ADD VALUE IF NOT EXISTS 'unauthorized_access';
ALTER TYPE security_event_type ADD VALUE IF NOT EXISTS 'api_access';
