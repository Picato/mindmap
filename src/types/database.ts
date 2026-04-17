export type Role = 'user' | 'admin'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  alias: string | null
  role: Role
  sales_roles: string[]
  job_title: string | null
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  content: string
  bantcare_content: string
  is_shared: boolean
  share_token: string
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  content: string
  updated_at: string
  updated_by: string | null
}

export interface UserGroup {
  id: string
  name: string
  created_at: string
  created_by: string | null
}

export interface GroupMember {
  group_id: string
  user_id: string
  added_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'share_token'> & { id?: string }
        Update: Partial<Omit<Project, 'id' | 'user_id'>>
      }
      templates: {
        Row: Template
        Insert: Omit<Template, 'id' | 'updated_at'>
        Update: Partial<Omit<Template, 'id'>>
      }
      user_groups: {
        Row: UserGroup
        Insert: Omit<UserGroup, 'id' | 'created_at'>
        Update: Partial<Omit<UserGroup, 'id'>>
      }
      group_members: {
        Row: GroupMember
        Insert: Omit<GroupMember, 'added_at'>
        Update: never
      }
    }
  }
}
