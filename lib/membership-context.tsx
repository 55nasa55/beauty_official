// ... existing imports ...

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

  useEffect(() => {
    if (DEBUG) {
      console.log("[Membership Debug] Effect triggered", {
        userId: user?.id,
        authLoading,
      });
    }

    // Wait until auth is fully ready
    if (authLoading) {
      if (DEBUG) {
        console.log("[Membership Debug] Auth still loading, waiting...");
      }
      return;
    }

    // No user = no membership
    if (!user) {
      if (DEBUG) {
        console.log("[Membership Debug] No user, setting isMember=false");
      }
      setIsMember(false);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    // ✅ ADD THIS LOG HERE
    console.log("USER ID FROM APP:", user?.id);

    // Prevent stale async updates
    let cancelled = false;

    const loadMembership = async () => {
      // Only set loading to true if we haven't successfully loaded yet
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      if (DEBUG) {
        console.log("[Membership Debug] Fetching membership for user:", user.id);
      }

      const { data, error } = await supabase
        .from("memberships")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      // ... rest of your code ...
    };

    loadMembership();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  return (
    <MembershipContext.Provider value={{ isMember, loading }}>
      {children}
    </MembershipContext.Provider>
  );
}