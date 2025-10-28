# Azure App Service Deployment Guide for CATCQRE

This guide provides comprehensive instructions for deploying the CATCQRE application to Azure App Service.

## Prerequisites

- Azure account with an active subscription
- Azure CLI installed (optional, for CLI deployment)
- Git repository connected to Azure (already configured)
- Node.js 22.x runtime

## Current Setup

Your application is already configured with:
- **App Name**: CATCQRE
- **Deployment Slot**: Production
- **GitHub Actions Workflow**: `.github/workflows/main_catcqre.yml`
- **Auto-deployment**: Enabled on push to `Main` branch

## Environment Variables Required

Before deployment, configure these environment variables in Azure:

1. **CATCQRE** - Your CATCQRE configuration value
2. **OPENAI_API_KEY** - Your OpenAI API key for AI features
3. **PORT** - Set to `8080` (Azure default) or `process.env.PORT`

### Setting Environment Variables in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your App Service: **CATCQRE**
3. In the left menu, select **Configuration** under Settings
4. Click **+ New application setting**
5. Add each environment variable:
   - Name: `CATCQRE`, Value: `[your-value]`
   - Name: `OPENAI_API_KEY`, Value: `[your-api-key]`
   - Name: `PORT`, Value: `8080`
6. Click **Save** at the top
7. Click **Continue** to restart the app

### Setting Environment Variables via Azure CLI

\`\`\`bash
az webapp config appsettings set --name CATCQRE --resource-group [your-resource-group] --settings CATCQRE="[your-value]" OPENAI_API_KEY="[your-api-key]" PORT="8080"
\`\`\`

## Deployment Methods

### Method 1: Automatic Deployment (Recommended - Already Configured)

Your app is configured for automatic deployment via GitHub Actions:

1. **Push to Main branch**:
   \`\`\`bash
   git add .
   git commit -m "Your commit message"
   git push origin Main
   \`\`\`

2. **Monitor deployment**:
   - Go to your GitHub repository
   - Click on **Actions** tab
   - Watch the "Build and deploy Node.js app to Azure Web App - CATCQRE" workflow
   - Deployment typically takes 3-5 minutes

3. **Verify deployment**:
   - Visit: `https://catcqre.azurewebsites.net`
   - Check the deployment logs in Azure Portal under **Deployment Center**

### Method 2: Manual Deployment via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your App Service: **CATCQRE**
3. Select **Deployment Center** from the left menu
4. Your GitHub repository should already be connected
5. Click **Sync** to manually trigger a deployment

### Method 3: Azure CLI Deployment

\`\`\`bash
# Login to Azure
az login

# Deploy from local directory
az webapp up --name CATCQRE --resource-group [your-resource-group] --runtime "NODE:22-lts"

# Or deploy from GitHub
az webapp deployment source sync --name CATCQRE --resource-group [your-resource-group]
\`\`\`

## Build Configuration

The application uses these npm scripts (configured in `package.json`):

\`\`\`json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
\`\`\`

Azure will automatically run:
1. `npm install` - Install dependencies
2. `npm run build` - Build the Next.js application
3. `npm run start` - Start the production server

## Troubleshooting

### Deployment Fails

**Check GitHub Actions logs**:
1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click on the failed workflow run
4. Review the build and deploy logs

**Common issues**:
- **Build fails**: Check for TypeScript errors or missing dependencies
- **Deploy fails**: Verify publish profile secret is correctly set in GitHub
- **App crashes**: Check environment variables are set correctly

### Application Not Starting

**Check Application Logs**:
1. Go to Azure Portal → Your App Service
2. Select **Log stream** from the left menu
3. Look for startup errors

**Common fixes**:
- Ensure `PORT` environment variable is set to `8080`
- Verify all required environment variables are configured
- Check that Node.js version matches (22.x)

### Environment Variables Not Working

1. Verify variables are set in Azure Portal under **Configuration**
2. Restart the app after adding/changing variables
3. Check variable names match exactly (case-sensitive)
4. For client-side variables, prefix with `NEXT_PUBLIC_`

### Performance Issues

**Enable Application Insights**:
1. Go to Azure Portal → Your App Service
2. Select **Application Insights** from the left menu
3. Click **Turn on Application Insights**
4. Monitor performance metrics and errors

**Scale up if needed**:
1. Go to **Scale up (App Service plan)**
2. Choose a higher tier for better performance

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Application accessible at `https://catcqre.azurewebsites.net`
- [ ] All features working correctly
- [ ] Log stream shows no errors
- [ ] GitHub Actions workflow completing successfully
- [ ] SSL certificate active (automatic with Azure)
- [ ] Custom domain configured (if needed)

## Monitoring and Maintenance

### View Logs
\`\`\`bash
# Stream logs via Azure CLI
az webapp log tail --name CATCQRE --resource-group [your-resource-group]
\`\`\`

### Restart Application
\`\`\`bash
# Via Azure CLI
az webapp restart --name CATCQRE --resource-group [your-resource-group]
\`\`\`

### Check Application Health
- Health endpoint: `https://catcqre.azurewebsites.net/api/health` (if implemented)
- Azure Portal: **Metrics** section shows CPU, memory, and request metrics

## Custom Domain Setup (Optional)

1. Go to Azure Portal → Your App Service
2. Select **Custom domains** from the left menu
3. Click **Add custom domain**
4. Follow the wizard to add your domain
5. Configure DNS records as instructed
6. Enable SSL/TLS certificate (free with Azure)

## Scaling Options

### Vertical Scaling (Scale Up)
- Go to **Scale up (App Service plan)**
- Choose a higher tier for more CPU/memory

### Horizontal Scaling (Scale Out)
- Go to **Scale out (App Service plan)**
- Increase instance count for high availability
- Configure auto-scaling rules based on metrics

## Security Best Practices

1. **Never commit secrets** to Git repository
2. **Use Azure Key Vault** for sensitive configuration
3. **Enable HTTPS only** in App Service settings
4. **Configure CORS** if needed for API endpoints
5. **Enable authentication** if required (Azure AD, etc.)
6. **Regular updates** - Keep dependencies updated

## Support and Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

## Quick Reference Commands

\`\`\`bash
# View app settings
az webapp config appsettings list --name CATCQRE --resource-group [your-resource-group]

# View deployment logs
az webapp log deployment show --name CATCQRE --resource-group [your-resource-group]

# SSH into container (for debugging)
az webapp ssh --name CATCQRE --resource-group [your-resource-group]

# Get app URL
az webapp show --name CATCQRE --resource-group [your-resource-group] --query defaultHostName -o tsv
\`\`\`

---

**Your app URL**: https://catcqre.azurewebsites.net

For additional help, contact your Azure administrator or refer to Azure support documentation.
