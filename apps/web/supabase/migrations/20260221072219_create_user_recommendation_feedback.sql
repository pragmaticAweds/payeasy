-- Create user_recommendation_feedback table
CREATE TABLE IF NOT EXISTS public.user_recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    ab_variant TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_recommendation_feedback_user_id ON public.user_recommendation_feedback(user_id);
