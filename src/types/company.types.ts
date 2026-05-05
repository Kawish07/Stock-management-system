export interface Company {
  name: string;
  company_name: string;
  abbr: string;
  country?: string;
  default_currency: string;
  phone_no?: string;
  email?: string;
  website?: string;
  tax_id?: string;
  creation?: string;
  modified?: string;
}

export type CreateCompanyDto = Omit<Company, 'name' | 'creation' | 'modified'>;
export type UpdateCompanyDto = Partial<CreateCompanyDto>;
