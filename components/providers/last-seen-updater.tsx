"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function LastSeenUpdater() {
  const { data: session } = useSession();
  
  useEffect(() => {
    console.log("LastSeenUpdater effect running, session:", session);
    
    // Only run if user is logged in
    if (!session?.user?.id) {
      console.log("No user session found, skipping last_seen update");
      return;
    }
    
    // Function to update last_seen
    const updateLastSeen = async () => {
      console.log("Attempting to update last_seen for user:", session.user.id);
      try {
        const supabase = createBrowserSupabaseClient();
        console.log("Supabase client created");
        
        // Log the query we're about to execute
        console.log("Executing query:", {
          table: 'user',
          update: { last_seen: new Date().toISOString() },
          filter: { user_id: session.user.id }
        });
        
        // Try a different approach - first check if the user exists
        const { data: userData, error: fetchError } = await supabase
          .from('user')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        console.log("User data fetch result:", { userData, fetchError });
        
        if (fetchError) {
          console.error("Error fetching user data:", fetchError);
          return;
        }
        
        // If user exists, update the last_seen field
        if (userData) {
          const { data, error } = await supabase
            .from('user')
            .update({ last_seen: new Date().toISOString() })
            .eq('user_id', session.user.id);
          
          console.log("Last seen update result:", { data, error });
          
          if (error) {
            console.error("Supabase error details:", {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
          }
        } else {
          console.log("User not found in database, cannot update last_seen");
        }
      } catch (error) {
        console.error("Error updating last_seen:", error);
        // Log more details about the caught error
        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      }
    };

    // Update immediately on login
    updateLastSeen();
    
    // Set up interval to update every minute
    const intervalId = setInterval(updateLastSeen, 60000);
    console.log("Set up interval for last_seen updates");
    
    // Clean up interval on unmount
    return () => {
      console.log("Cleaning up last_seen update interval");
      clearInterval(intervalId);
    };
  }, [session]);

  // This component doesn't render anything
  return null;
} 