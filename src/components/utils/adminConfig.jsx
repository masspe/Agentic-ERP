// Super Admin Configuration
export const SUPER_ADMIN_EMAIL = "abdullahpaacha@gmail.com";

// Check if current user is super admin
export const isSuperAdmin = (userEmail) => {
  return userEmail === SUPER_ADMIN_EMAIL;
};

// Get super admin access rules for RLS
export const getSuperAdminRLS = () => ({
  read: {
    "$or": [
      {
        "created_by": "{{user.email}}"
      },
      {
        "user_condition": {
          "role": "admin"
        }
      },
      {
        "user_condition": {
          "email": SUPER_ADMIN_EMAIL
        }
      }
    ]
  },
  write: {
    "$or": [
      {
        "created_by": "{{user.email}}"
      },
      {
        "user_condition": {
          "role": "admin"
        }
      },
      {
        "user_condition": {
          "email": SUPER_ADMIN_EMAIL
        }
      }
    ]
  }
});