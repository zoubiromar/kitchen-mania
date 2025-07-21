# GitHub-Based Development Workflow

This guide explains how to use GitHub as the primary source for updates after deploying to Vercel.

## Initial Setup

### 1. Configure Git Identity
First, set your Git identity (if not already done):
```bash
git config --global user.email "your-github-email@example.com"
git config --global user.name "Your Name"
```

### 2. Complete Initial Push
```bash
# Commit your changes
git commit -m "Initial commit - KitchenMania app"

# Add remote repository
git remote add origin git@github.com:zoubiromar/kitchen-mania.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Connect Vercel to GitHub
1. Go to [vercel.com](https://vercel.com)
2. Import project from GitHub
3. Select `zoubiromar/kitchen-mania`
4. Configure environment variables:
   - `OPENAI_API_KEY` = your API key
5. Deploy!

## Development Workflow

### Branch Strategy

**Main Branch (`main`)**
- Production-ready code
- Automatically deploys to production URL
- Protected branch (no direct pushes)

**Development Branch (`develop`)**
- Integration branch for features
- Automatically deploys to preview URL
- Test features before merging to main

**Feature Branches (`feature/*`)**
- Individual features/fixes
- Create PR to develop when ready
- Gets preview deployment

### Workflow Steps

#### 1. Create Feature Branch
```bash
# Pull latest changes
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/add-supabase-auth
```

#### 2. Make Changes
```bash
# Make your changes
# Test locally
npm run dev

# Commit changes
git add .
git commit -m "feat: Add Supabase authentication"
```

#### 3. Push to GitHub
```bash
git push origin feature/add-supabase-auth
```

#### 4. Create Pull Request
1. Go to GitHub repository
2. Click "Compare & pull request"
3. Target: `develop` branch
4. Add description of changes
5. Submit PR

#### 5. Preview Deployment
- Vercel automatically creates preview deployment
- Test your changes on preview URL
- Share preview with team for feedback

#### 6. Merge to Develop
```bash
# After PR approval
git checkout develop
git pull origin develop
git merge feature/add-supabase-auth
git push origin develop
```

#### 7. Deploy to Production
```bash
# After testing on develop
git checkout main
git pull origin main
git merge develop
git push origin main
```

## Vercel Integration Features

### Automatic Deployments
- **Production**: Every push to `main`
- **Preview**: Every push to other branches
- **Pull Request**: Comments with preview URL

### Environment Variables
1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Add variables for different environments:
   - Production
   - Preview
   - Development

### Deploy Hooks
Create deploy hooks for manual deployments:
1. Project Settings → Git → Deploy Hooks
2. Create hook for specific branch
3. Trigger via webhook URL

## Best Practices

### 1. Commit Messages
Use conventional commits:
```
feat: Add user authentication
fix: Resolve receipt parsing error
docs: Update README
style: Format code
refactor: Optimize API calls
test: Add unit tests
chore: Update dependencies
```

### 2. Pull Request Template
Create `.github/pull_request_template.md`:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Tested on preview deployment
- [ ] Added/updated tests

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
```

### 3. GitHub Actions (Optional)
Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linter
      run: npm run lint
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
```

## Collaboration

### Adding Team Members
1. GitHub: Settings → Manage access → Invite
2. Vercel: Project Settings → Team → Invite

### Code Review Process
1. Create PR with clear description
2. Request review from team
3. Address feedback
4. Merge after approval

### Rollback Strategy
If issues in production:
1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

Or via Git:
```bash
git checkout main
git revert HEAD
git push origin main
```

## Monitoring

### Vercel Analytics
1. Enable in project settings
2. Monitor:
   - Page views
   - Performance metrics
   - Error rates

### GitHub Insights
- Track contributions
- Review PR metrics
- Monitor issues

## Next Steps

1. **Set Git identity** and complete initial push
2. **Deploy to Vercel** via GitHub integration
3. **Create develop branch** for staging
4. **Set up branch protection** rules
5. **Configure Vercel** preview deployments
6. **Start feature development** using branches

This workflow ensures:
- Clean version history
- Easy collaboration
- Automatic deployments
- Rollback capability
- Preview environments 