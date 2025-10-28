# Azure Static Web Apps Deployment Guide

This guide will help you deploy your CATCQRE application to Azure Static Web Apps.

## Why Azure Static Web Apps?

Azure Static Web Apps is ideal for Next.js applications because it:
- ✅ Has built-in Next.js support with automatic configuration
- ✅ Includes a generous free tier (100 GB bandwidth/month)
- ✅ Provides automatic CI/CD from GitHub
- ✅ Supports API routes and server-side rendering
- ✅ Includes free SSL certificates
- ✅ Has global CDN distribution for better performance
- ✅ Simpler configuration than App Service

## Prerequisites

- Azure account (create free at https://azure.microsoft.com/free/)
- GitHub repository with your code
- Environment variables ready: `CATCQRE`, `OPENAI_API_KEY`, `PORT`

## Deployment Steps

### Option 1: Deploy via Azure Portal (Recommended for First Time)

#### Step 1: Create Static Web App

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Static Web App"** and select it
4. Click **"Create"**

#### Step 2: Configure Basic Settings

Fill in the following:

- **Subscription**: Select your Azure subscription
- **Resource Group**: Create new or select existing (e.g., `catcqre-rg`)
- **Name**: `catcqre-app` (or your preferred name)
- **Plan type**: 
  - **Free** (for development/testing - 100 GB bandwidth)
  - **Standard** (for production - unlimited bandwidth, custom domains)
- **Region**: Choose closest to your users (e.g., `East US 2`, `West Europe`)
- **Deployment source**: **GitHub**

#### Step 3: Connect to GitHub

1. Click **"Sign in with GitHub"** and authorize Azure
2. Select your GitHub organization/account
3. Choose your repository: **CATCQRE.AI**
4. Select branch: **Main**

#### Step 4: Build Configuration

Azure will auto-detect Next.js. Verify these settings:

- **Build Presets**: `Next.js`
- **App location**: `/` (root of repository)
- **Api location**: Leave empty (Next.js API routes are auto-detected)
- **Output location**: Leave empty (Next.js handles this)

#### Step 5: Review and Create

1. Click **"Review + create"**
2. Review all settings
3. Click **"Create"**

Azure will:
- Create the Static Web App resource
- Add a GitHub Actions workflow to your repository
- Trigger the first deployment automatically

#### Step 6: Configure Environment Variables

1. Go to your Static Web App in Azure Portal
2. Click **"Configuration"** in the left menu
3. Click **"+ Add"** to add each variable:

| Name | Value | Notes |
|------|-------|-------|
| `CATCQRE` | `your-value` | Your CATCQRE configuration |
| `OPENAI_API_KEY` | `your-api-key` | Your OpenAI API key |
| `PORT` | `3000` | Application port |

4. Click **"Save"** after adding all variables

**Important**: Environment variables in Static Web Apps are only available in API routes and server-side code, not in client-side code. Prefix with `NEXT_PUBLIC_` if needed in browser.

#### Step 7: Monitor Deployment

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. Watch the deployment workflow run
4. Once complete (green checkmark), your app is live!

#### Step 8: Access Your Application

1. In Azure Portal, go to your Static Web App
2. Find the **URL** on the Overview page (e.g., `https://catcqre-app.azurestaticapps.net`)
3. Click to open your deployed application

---

### Option 2: Deploy via Azure CLI

If you prefer command-line deployment:

\`\`\`bash
# Install Azure CLI (if not already installed)
# Visit: https://docs.microsoft.com/cli/azure/install-azure-cli

# Login to Azure
az login

# Create resource group
az group create \
  --name catcqre-rg \
  --location eastus2

# Create Static Web App
az staticwebapp create \
  --name catcqre-app \
  --resource-group catcqre-rg \
  --source https://github.com/YOUR-USERNAME/CATCQRE.AI \
  --location eastus2 \
  --branch Main \
  --app-location "/" \
  --login-with-github

# Add environment variables
az staticwebapp appsettings set \
  --name catcqre-app \
  --resource-group catcqre-rg \
  --setting-names CATCQRE=your-value OPENAI_API_KEY=your-key PORT=3000
\`\`\`

---

## Configuration File (Optional)

Azure Static Web Apps can use a `staticwebapp.config.json` file for advanced configuration. This file has been created in your project root.

Key features configured:
- Custom routing rules
- Response headers for security
- Navigation fallback for client-side routing
- MIME types for static assets

---

## GitHub Actions Workflow

Azure automatically creates a workflow file at `.github/workflows/azure-static-web-apps-<name>.yml`.

The workflow:
- Triggers on push to Main branch and pull requests
- Builds your Next.js application
- Deploys to Azure Static Web Apps
- Runs on every commit automatically

You can view and edit this workflow in your repository.

---

## Troubleshooting

### Build Fails

**Check build logs:**
1. Go to GitHub Actions tab
2. Click on the failed workflow run
3. Expand the "Build And Deploy" step
4. Look for error messages

**Common issues:**
- Missing dependencies: Ensure all packages are in `package.json`
- Build script errors: Test `npm run build` locally
- Environment variables: Verify they're set in Azure Portal

### Application Not Loading

**Check deployment status:**
\`\`\`bash
az staticwebapp show \
  --name catcqre-app \
  --resource-group catcqre-rg \
  --query "defaultHostname"
\`\`\`

**Common issues:**
- DNS propagation: Wait 5-10 minutes after first deployment
- Browser cache: Try incognito/private mode
- Check Azure Portal for deployment status

### Environment Variables Not Working

**Verify variables are set:**
\`\`\`bash
az staticwebapp appsettings list \
  --name catcqre-app \
  --resource-group catcqre-rg
\`\`\`

**Important notes:**
- Variables are only available server-side by default
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Restart may be needed after adding variables

### API Routes Not Working

**Check configuration:**
- Ensure API routes are in `app/api/` directory
- Verify routes use proper Next.js App Router syntax
- Check function logs in Azure Portal under "Functions" section

---

## Monitoring and Logs

### View Application Logs

1. Go to Azure Portal
2. Navigate to your Static Web App
3. Click **"Functions"** in left menu
4. Click on a function to see logs

### View Deployment History

1. In Azure Portal, go to your Static Web App
2. Click **"Environments"** in left menu
3. See all deployments with timestamps and status

### Set Up Alerts

1. In Azure Portal, go to your Static Web App
2. Click **"Alerts"** in left menu
3. Click **"+ Create alert rule"**
4. Configure alerts for:
   - Failed deployments
   - High response times
   - Error rates

---

## Custom Domain (Optional)

### Add Custom Domain

1. In Azure Portal, go to your Static Web App
2. Click **"Custom domains"** in left menu
3. Click **"+ Add"**
4. Choose domain type:
   - **Custom domain on other DNS** (most common)
   - **Custom domain on Azure DNS**
5. Follow the wizard to add DNS records
6. Wait for validation (can take up to 48 hours)

### SSL Certificate

- Azure automatically provisions free SSL certificates
- Certificates auto-renew
- No configuration needed

---

## Scaling and Performance

### Free Tier Limits
- 100 GB bandwidth per month
- 2 custom domains
- Unlimited API requests

### Standard Tier Benefits
- Unlimited bandwidth
- 5 custom domains
- SLA guarantee (99.95% uptime)
- Staging environments

### Upgrade to Standard

\`\`\`bash
az staticwebapp update \
  --name catcqre-app \
  --resource-group catcqre-rg \
  --sku Standard
\`\`\`

---

## Staging Environments

Static Web Apps automatically creates staging environments for pull requests:

1. Create a pull request in GitHub
2. Azure creates a temporary staging URL
3. Test changes in isolation
4. Merge PR to deploy to production

Staging URL format: `https://catcqre-app-<pr-number>.azurestaticapps.net`

---

## Cost Estimation

### Free Tier
- **Cost**: $0/month
- **Bandwidth**: 100 GB/month
- **Best for**: Development, testing, small projects

### Standard Tier
- **Cost**: ~$9/month base + bandwidth
- **Bandwidth**: $0.20 per GB after first 100 GB
- **Best for**: Production applications

**Example monthly costs:**
- Small app (< 100 GB): $9/month
- Medium app (500 GB): $9 + (400 × $0.20) = $89/month
- Large app (2 TB): $9 + (1,900 × $0.20) = $389/month

---

## Comparison: Static Web Apps vs App Service

| Feature | Static Web Apps | App Service |
|---------|----------------|-------------|
| **Best for** | Static sites, JAMstack, Next.js | Complex apps, containers |
| **Pricing** | Free tier available | Starts at ~$13/month |
| **Setup** | Very simple | More complex |
| **Performance** | Global CDN | Single region (unless configured) |
| **Scaling** | Automatic | Manual or auto-scale rules |
| **CI/CD** | Built-in GitHub Actions | Requires configuration |

**Recommendation**: Use Static Web Apps for this Next.js application unless you need specific App Service features.

---

## Next Steps After Deployment

- [ ] Verify application loads correctly
- [ ] Test all features and API routes
- [ ] Check environment variables are working
- [ ] Set up custom domain (if needed)
- [ ] Configure monitoring and alerts
- [ ] Test staging environment with a PR
- [ ] Document the deployment URL for your team
- [ ] Set up backup/disaster recovery plan

---

## Useful Commands

\`\`\`bash
# View Static Web App details
az staticwebapp show --name catcqre-app --resource-group catcqre-rg

# List all Static Web Apps
az staticwebapp list --resource-group catcqre-rg

# View environment variables
az staticwebapp appsettings list --name catcqre-app --resource-group catcqre-rg

# Delete Static Web App
az staticwebapp delete --name catcqre-app --resource-group catcqre-rg

# View deployment token (for manual deployments)
az staticwebapp secrets list --name catcqre-app --resource-group catcqre-rg
\`\`\`

---

## Support Resources

- **Azure Static Web Apps Documentation**: https://docs.microsoft.com/azure/static-web-apps/
- **Next.js on Azure**: https://docs.microsoft.com/azure/static-web-apps/deploy-nextjs
- **Azure Support**: https://azure.microsoft.com/support/
- **GitHub Actions Documentation**: https://docs.github.com/actions

---

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **API Keys**: Rotate regularly, use Azure Key Vault for sensitive data
3. **CORS**: Configure properly in `staticwebapp.config.json`
4. **Authentication**: Use Azure AD or built-in authentication providers
5. **HTTPS**: Always enabled by default, never disable

---

## Rollback Procedure

If a deployment causes issues:

1. Go to GitHub repository
2. Find the last working commit
3. Create a new commit that reverts changes:
   \`\`\`bash
   git revert <commit-hash>
   git push origin Main
   \`\`\`
4. GitHub Actions will automatically deploy the reverted version

Or use Azure Portal:
1. Go to Static Web App
2. Click "Environments"
3. Find previous successful deployment
4. Click "Promote to production"

---

## Summary

Azure Static Web Apps provides the easiest deployment path for your Next.js CATCQRE application with:
- ✅ Automatic GitHub integration
- ✅ Free tier for development
- ✅ Global CDN performance
- ✅ Simple environment variable management
- ✅ Built-in staging environments

Follow the steps above to get your application deployed in minutes!
