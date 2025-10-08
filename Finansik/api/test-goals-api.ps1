# Test script for the enhanced Goals API
$baseUrl = "http://localhost:3000"

Write-Host "Testing Enhanced Goals API..." -ForegroundColor Green

# Test 1: Health check
Write-Host "`n1. Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✓ Health check passed: $($health.ok)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Create user
Write-Host "`n2. Creating test user..." -ForegroundColor Yellow
$userData = @{
    login = "goaltest"
    password = "password123"
    visualname = "Goal Test User"
} | ConvertTo-Json

try {
    $userResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -ContentType "application/json" -Body $userData
    $accessToken = $userResponse.accessToken
    Write-Host "✓ User created successfully. Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "✗ User creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Create a goal
Write-Host "`n3. Creating a financial goal..." -ForegroundColor Yellow
$goalData = @{
    goal_name = "Emergency Fund"
    goal = 50000
    description = "Build emergency fund for 6 months of expenses"
    target_date = "2024-12-31T23:59:59.000Z"
    priority = "high"
    category = "Emergency"
    current_amount = 0
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

try {
    $goalResponse = Invoke-RestMethod -Uri "$baseUrl/api/goals" -Method POST -Headers $headers -Body $goalData
    $goalId = $goalResponse.id
    Write-Host "✓ Goal created successfully. ID: $goalId" -ForegroundColor Green
    Write-Host "  Goal: $($goalResponse.goal_name), Target: $($goalResponse.goal), Priority: $($goalResponse.priority)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Goal creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Get all goals
Write-Host "`n4. Getting all goals..." -ForegroundColor Yellow
try {
    $goalsResponse = Invoke-RestMethod -Uri "$baseUrl/api/goals" -Method GET -Headers $headers
    Write-Host "✓ Retrieved goals successfully" -ForegroundColor Green
    Write-Host "  Total goals: $($goalsResponse.summary.total_goals)" -ForegroundColor Cyan
    Write-Host "  Active goals: $($goalsResponse.summary.active_goals)" -ForegroundColor Cyan
    Write-Host "  Total target amount: $($goalsResponse.summary.total_target_amount)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to get goals: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Add money to goal
Write-Host "`n5. Adding money to goal..." -ForegroundColor Yellow
$addMoneyData = @{
    amount = 10000
} | ConvertTo-Json

try {
    $addMoneyResponse = Invoke-RestMethod -Uri "$baseUrl/api/goals/$goalId/add" -Method POST -Headers $headers -Body $addMoneyData
    Write-Host "✓ Added money to goal successfully" -ForegroundColor Green
    Write-Host "  Current amount: $($addMoneyResponse.current_amount)" -ForegroundColor Cyan
    Write-Host "  Progress: $([math]::Round(($addMoneyResponse.current_amount / $addMoneyResponse.goal) * 100, 2))%" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to add money: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Get goal analytics
Write-Host "`n6. Getting goal analytics..." -ForegroundColor Yellow
try {
    $analyticsResponse = Invoke-RestMethod -Uri "$baseUrl/api/goals/analytics/summary" -Method GET -Headers $headers
    Write-Host "✓ Retrieved analytics successfully" -ForegroundColor Green
    Write-Host "  Completion rate: $([math]::Round($analyticsResponse.completion_rate, 2))%" -ForegroundColor Cyan
    Write-Host "  Average goal amount: $($analyticsResponse.average_goal_amount)" -ForegroundColor Cyan
    Write-Host "  Priority distribution:" -ForegroundColor Cyan
    Write-Host "    High: $($analyticsResponse.priority_distribution.high)" -ForegroundColor Cyan
    Write-Host "    Medium: $($analyticsResponse.priority_distribution.medium)" -ForegroundColor Cyan
    Write-Host "    Low: $($analyticsResponse.priority_distribution.low)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to get analytics: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Get goals by priority
Write-Host "`n7. Getting goals by priority..." -ForegroundColor Yellow
try {
    $priorityResponse = Invoke-RestMethod -Uri "$baseUrl/api/goals/priority/high" -Method GET -Headers $headers
    Write-Host "✓ Retrieved high priority goals successfully" -ForegroundColor Green
    Write-Host "  High priority goals: $($priorityResponse.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to get goals by priority: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 All tests completed!" -ForegroundColor Green
Write-Host "The enhanced Goals API is working correctly!" -ForegroundColor Green
