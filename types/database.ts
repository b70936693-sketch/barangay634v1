export type Database = {
  public: {
    Tables: {
      job_posts: {
        Row: {
          id: string
          title: string
          position: string
          post_type: string
          qualifications: string | null
          employer_requirements: string[] | null
          admin_requirements: string[] | null
          description: string | null
          employment_type: string | null
          schedule: string | null
          salary: string | null
          urgency: 'normal' | 'urgent' | 'immediate'
          employer_id: string
          status: 'pending' | 'active' | 'closed'
          created_at: string
          applicant_count: number | null
        }
        Insert: {
          id?: string
          title: string
          position: string
          post_type: string
          qualifications?: string | null
          employer_requirements?: string[] | null
          admin_requirements?: string[] | null
          description?: string | null
          employment_type?: string | null
          schedule?: string | null
          salary?: string | null
          urgency?: 'normal' | 'urgent' | 'immediate'
          employer_id: string
          status?: 'pending' | 'active' | 'closed'
          created_at?: string
          applicant_count?: number | null
        }
        Update: {
          id?: string
          title?: string
          position?: string
          post_type?: string
          qualifications?: string | null
          employer_requirements?: string[] | null
          admin_requirements?: string[] | null
          description?: string | null
          employment_type?: string | null
          schedule?: string | null
          salary?: string | null
          urgency?: 'normal' | 'urgent' | 'immediate'
          employer_id?: string
          status?: 'pending' | 'active' | 'closed'
          created_at?: string
          applicant_count?: number | null
        }
      }
      applications: {
        Row: {
          id: string
          job_post_id: string
          full_name: string
          email: string
          phone: string
          introduction: string
          documents: string[]
          availability: string | null
          shift_preference: string | null
          status: 'pending' | 'reviewed' | 'interview' | 'hired' | 'rejected'
          applied_date: string
        }
        Insert: {
          id?: string
          job_post_id: string
          full_name: string
          email: string
          phone: string
          introduction: string
          documents: string[]
          availability?: string | null
          shift_preference?: string | null
          status?: 'pending' | 'reviewed' | 'interview' | 'hired' | 'rejected'
          applied_date?: string
        }
        Update: {
          id?: string
          job_post_id?: string
          full_name?: string
          email?: string
          phone?: string
          introduction?: string
          documents?: string[]
          availability?: string | null
          shift_preference?: string | null
          status?: 'pending' | 'reviewed' | 'interview' | 'hired' | 'rejected'
          applied_date?: string
        }
      }
      employer_profiles: {
        Row: {
          id: string
          company_name: string
          location: string | null
        }
      }
    }
  }
}

