// Helper function to dynamically derive campus from email domain
export const getCampusFromEmail = (emailInput) => {
  if (!emailInput.includes('@') || !emailInput.endsWith('.edu')) {
    return "Requires a valid .edu email";
  }
  
  const domain = emailInput.split('@')[1].toLowerCase();
  
  // Tier 1: Hardcoded specific formatting (match backend logic)
  switch (domain) {
    case 'wisc.edu': return "UW-Madison";
    case 'mit.edu': return "MIT";
    case 'stanford.edu': return "Stanford";
    case 'harvard.edu': return "Harvard";
  }

  // Tier 2: Dynamic fallback for every other US college
  // e.g., "berkeley.edu" -> "Berkeley"
  const raw = domain.replace('.edu', '');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};
