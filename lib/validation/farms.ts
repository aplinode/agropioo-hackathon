import { z } from 'zod';
import { PAKISTAN_DISTRICTS } from '@/lib/farms/districts';
import { CROPS } from '@/lib/farms/constants';
import { RECORD_TYPES } from '@/lib/farms/constants';
import { SEASONS } from '@/lib/farms/constants';
import { WEATHER_CONDITIONS } from '@/lib/farms/constants';
import { YEAR_OPTIONS } from '@/lib/farms/constants';

const districtEnum = z.enum(PAKISTAN_DISTRICTS).superRefine((val, ctx) => {
  if (!PAKISTAN_DISTRICTS.includes(val)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a valid district' });
});

const cropEnum = z.enum(CROPS);
const recordTypeEnum = z.enum(RECORD_TYPES);
const seasonEnum = z.enum(SEASONS);
const weatherEnum = z.enum(WEATHER_CONDITIONS);
const yearEnum = z.enum(YEAR_OPTIONS as unknown as [string, ...string[]]);

export const createFarmSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  location: z.string().min(1, 'Location is required'),
  district: districtEnum,
  crops: z.array(cropEnum).min(1, 'Select at least one crop').max(10),
  acres: z.coerce.number().positive('Acres must be greater than 0').max(99999),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const updateFarmSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120).optional(),
  location: z.string().min(1, 'Location is required').optional(),
  district: districtEnum.optional(),
  crops: z.array(cropEnum).min(1, 'Select at least one crop').max(10).optional(),
  acres: z.coerce.number().positive('Acres must be greater than 0').max(99999).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  growth_stages: z.any().optional(),
});

export const createRecordSchema = z.object({
  farm_id: z.string().uuid(),
  type: recordTypeEnum,
  season: seasonEnum,
  year: yearEnum,
  event_date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  title: z.string().max(200).optional().nullable(),
  note: z.string().optional().nullable(),
  weather_condition: weatherEnum.optional().nullable(),
  yield_qty: z.coerce.number().gte(0).optional().nullable(),
  labor_cost: z.coerce.number().gte(0).optional().nullable(),
  transport_cost: z.coerce.number().gte(0).optional().nullable(),
});

export const updateRecordSchema = z.object({
  type: recordTypeEnum.optional(),
  season: seasonEnum.optional(),
  year: yearEnum.optional(),
  event_date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date').optional(),
  title: z.string().max(200).optional().nullable(),
  note: z.string().optional().nullable(),
  weather_condition: weatherEnum.optional().nullable(),
  yield_qty: z.coerce.number().gte(0).optional().nullable(),
  labor_cost: z.coerce.number().gte(0).optional().nullable(),
  transport_cost: z.coerce.number().gte(0).optional().nullable(),
});

export const listRecordsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  season: seasonEnum.optional(),
  year: z.string().optional(),
});

export type CreateFarmInput = z.infer<typeof createFarmSchema>;
export type UpdateFarmInput = z.infer<typeof updateFarmSchema>;
export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;
