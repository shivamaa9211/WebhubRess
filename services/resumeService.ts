import { supabase } from './supabaseClient';
import { ResumeData, TemplateType } from '../types';

export interface DbResume {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  template: string;
  status: 'draft' | 'completed' | 'review';
  data: ResumeData;
}

// Map frontend data to DB structure and save
export const saveResumeToDb = async (data: ResumeData, template: TemplateType, status: string = 'draft') => {
  const fullName = `${data.personalInfo.firstName} ${data.personalInfo.lastName}`;
  const email = data.personalInfo.email;

  const { data: result, error } = await supabase
    .from('resumes')
    .insert([
      { 
        full_name: fullName,
        email: email,
        template: template,
        status: status,
        data: data 
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving resume:', error);
    throw error;
  }
  return result;
};

// Update an existing resume
export const updateResumeInDb = async (id: string, data: ResumeData, template: TemplateType, status: string = 'completed') => {
  const fullName = `${data.personalInfo.firstName} ${data.personalInfo.lastName}`;
  const email = data.personalInfo.email;

  const { error } = await supabase
    .from('resumes')
    .update({ 
      full_name: fullName,
      email: email,
      template: template,
      status: status,
      data: data 
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating resume:', error);
    throw error;
  }
};

export const fetchAllResumes = async (): Promise<DbResume[]> => {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .order('created_at', { ascending: false }); // Newest first by default for display

  if (error) {
    console.error('Error fetching resumes:', error);
    return [];
  }
  return data as DbResume[];
};

export const deleteResumeById = async (id: string) => {
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const deleteAllResumes = async () => {
  // Truncate logic (delete all rows)
  const { error } = await supabase
    .from('resumes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything that has an ID

  if (error) throw error;
};

/**
 * Implements the specific auto-cleanup logic requested:
 * "if user set 50 then if there 50 then remove 49 not exat 50"
 * Logic: If count >= limit, keep only the 1 newest record. Delete (Total - 1) oldest records.
 */
export const performAutoCleanup = async (limit: number) => {
  // 1. Get all IDs ordered by creation time (Oldest First)
  const { data: allRecords, error } = await supabase
    .from('resumes')
    .select('id, created_at')
    .order('created_at', { ascending: true });

  if (error || !allRecords) return;

  const totalCount = allRecords.length;

  if (totalCount >= limit) {
    // Determine how many to delete. We want to keep ONLY the newest one.
    // So we delete all except the last one in the chronological list.
    // However, the prompt says "remove 49", implying we remove (Limit - 1).
    // Let's stick to the logic: If we have 50, and limit is 50, we remove 49.
    
    // We want to delete the oldest (totalCount - 1) records.
    const recordsToDelete = allRecords.slice(0, totalCount - 1);
    const idsToDelete = recordsToDelete.map(r => r.id);

    if (idsToDelete.length > 0) {
      console.log(`Auto-Cleanup Triggered: Deleting ${idsToDelete.length} records to keep the single newest one.`);
      await supabase
        .from('resumes')
        .delete()
        .in('id', idsToDelete);
    }
  }
};