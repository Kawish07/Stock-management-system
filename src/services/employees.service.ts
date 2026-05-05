import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type { Employee, CreateEmployeeDto, UpdateEmployeeDto } from '@/types/employee.types';

const FIELDS = [
  'name',
  'employee_name',
  'first_name',
  'last_name',
  'company',
  'status',
  'designation',
  'department',
  'date_of_joining',
  'date_of_birth',
  'gender',
  'cell_number',
  'personal_email',
  'company_email',
  'ctc',
  'creation',
];

export const employeesService = {
  async getAllEmployees(params?: {
    search?: string;
    company?: string;
    status?: string;
    limit?: number;
    start?: number;
  }): Promise<{ data: Employee[]; total: number }> {
    try {
      const limit = params?.limit ?? 50;
      const start = params?.start ?? 0;
      const filters: string[][] = [];

      if (params?.company) {
        filters.push(['Employee', 'company', '=', params.company]);
      }
      if (params?.status) {
        filters.push(['Employee', 'status', '=', params.status]);
      }

      const orFilters = params?.search
        ? [
            ['Employee', 'employee_name', 'like', `%${params.search}%`],
            ['Employee', 'designation', 'like', `%${params.search}%`],
            ['Employee', 'department', 'like', `%${params.search}%`],
          ]
        : undefined;

      const [listRes, countRes] = await Promise.all([
        axiosInstance.get('/resource/Employee', {
          params: {
            fields: JSON.stringify(FIELDS),
            filters: filters.length ? JSON.stringify(filters) : undefined,
            or_filters: orFilters ? JSON.stringify(orFilters) : undefined,
            limit,
            limit_start: start,
            order_by: 'creation desc',
          },
        }),
        axiosInstance.get('/resource/Employee', {
          params: {
            fields: JSON.stringify(['name']),
            filters: filters.length ? JSON.stringify(filters) : undefined,
            or_filters: orFilters ? JSON.stringify(orFilters) : undefined,
            limit: 0,
          },
        }),
      ]);

      return {
        data: (listRes.data.data ?? []) as Employee[],
        total: (countRes.data.data ?? []).length,
      };
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async getEmployee(name: string): Promise<Employee> {
    try {
      const res = await axiosInstance.get(`/resource/Employee/${encodeURIComponent(name)}`);
      return res.data.data as Employee;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async createEmployee(data: CreateEmployeeDto): Promise<Employee> {
    try {
      const res = await axiosInstance.post('/resource/Employee', data);
      return res.data.data as Employee;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async updateEmployee(name: string, data: UpdateEmployeeDto): Promise<Employee> {
    try {
      const res = await axiosInstance.put(
        `/resource/Employee/${encodeURIComponent(name)}`,
        data
      );
      return res.data.data as Employee;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async deleteEmployee(name: string): Promise<void> {
    try {
      await axiosInstance.delete(`/resource/Employee/${encodeURIComponent(name)}`);
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },
};
