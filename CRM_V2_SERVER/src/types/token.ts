export type PermissionMode = {
  view: boolean;
  edit: boolean;
  deny: boolean;
};

export interface Token {
  id?: any;
  firstName?: string | null;
  lastName?: string | null;
  refNo?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  pages?: Record<string, boolean>;
  components?: Record<string, Record<string, PermissionMode>>;
  subscriptionStatus?: string | null;
  validUntil?: Date | null;
  actualUserId?: string | null;
  actualFirstName?: string | null;
  actualLastName?: string | null;
  actualPhone?: string | null;
  actualEmail?: string | null;
}
