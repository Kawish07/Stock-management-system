export interface Customer {
  name: string;
  customer_name: string;
  customer_type: 'Company' | 'Individual';
  customer_group: string;
  territory: string;
  mobile_no?: string;
  email_id?: string;
  tax_id?: string;
  website?: string;
  customer_details?: string;
  disabled: 0 | 1;
  creation?: string;
}

export interface CustomerAddress {
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  country: string;
  pincode?: string;
  phone?: string;
  is_primary_address: 1 | 0;
}

export interface CustomerListParams {
  search?: string;
  limit?: number;
  start?: number;
  customer_type?: 'Company' | 'Individual';
  customer_group?: string;
}

export interface RecentInvoice {
  name: string;
  posting_date: string;
  grand_total: number;
  outstanding_amount: number;
  docstatus: 0 | 1 | 2;
}
