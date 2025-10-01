# Database Seeds

This directory contains database seed scripts for populating the database with initial data.

## Available Seeds

### Add Super Admin (`addSuperAdmin.ts`)

Creates or updates a super admin user in the database.

#### Usage

```bash
# Using yarn
yarn seed:admin email=admin@example.com pass=yourpassword

# Using npm
npm run seed:admin email=admin@example.com pass=yourpassword
```

#### Parameters

- `email` (required): Admin user's email address
- `pass` (required): Admin user's password (will be hashed automatically)

#### Examples

```bash
# Create admin with email admin@company.com and password admin123
yarn seed:admin email=admin@company.com pass=admin123

# Create admin with email super@violetshift.com and password MySecurePass123
yarn seed:admin email=super@violetshift.com pass=MySecurePass123
```

#### Features

- **Idempotent**: Running the same command multiple times won't create duplicate users
- **Password Hashing**: Passwords are automatically hashed using bcrypt
- **Update Existing**: If an admin with the same email exists, the password will be updated if it has changed
- **Minimal Required Fields**: Only email and password are required; other fields can be filled later

#### Environment Requirements

Make sure you have the following environment variables set:

- `MONGO_URL`: MongoDB connection string
- `JWT_SECRET`: JWT secret for token generation (if using auth features)

#### Output

The script will output one of the following messages:

- `"Admin user created."` - New admin user was successfully created
- `"Admin user updated."` - Existing admin user password was updated
- `"Admin user already exists and is up to date."` - Admin user exists and password hasn't changed
- `"Seed completed."` - Script finished successfully

#### Error Handling

- If email or password is missing, the script will show usage instructions and exit
- If database connection fails, the error will be displayed
- The script will always attempt to disconnect from the database before exiting

## Adding New Seeds

To add a new seed script:

1. Create a new TypeScript file in this directory
2. Follow the pattern of `addSuperAdmin.ts`:
   - Import necessary dependencies
   - Connect to database using `connectDB()`
   - Perform seed operations
   - Handle errors appropriately
   - Disconnect using `disconnectDB()`
3. Add a corresponding npm script in `package.json`
4. Update this README with documentation

## Troubleshooting

### Common Issues

1. **"MONGO_URL is not defined"**
   - Ensure your `.env` file contains the `MONGO_URL` variable
   - Check that the MongoDB connection string is correct

2. **"Usage: yarn seed:admin email=admin@mail.com pass=123123"**
   - Make sure you're providing both email and password parameters
   - Check the parameter format (email=value pass=value)

3. **Database connection errors**
   - Verify MongoDB is running
   - Check network connectivity
   - Ensure the connection string is valid
