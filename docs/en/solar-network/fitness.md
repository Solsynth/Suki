# Fitness Center

Track your workouts, log body metrics, and set fitness goals.

## Introduction

The Fitness Center is Solar Network's fitness tracking service, designed to help you:

- Log every workout
- Track body metrics (weight, steps, etc.)
- Set and achieve fitness goals
- Compare workout data with friends

---

## Privacy Settings

All fitness records (workouts, metrics, goals) have a visibility setting:

| Setting | Description |
| :--- | :--- |
| Private | Only visible to you |
| Public | Visible to anyone when embedded in a post |

By default, all records are **Private**. If you want others to see them, you need to set the visibility to "Public".

---

## Logging Workouts

### Workout Types

| Type | Value | Description |
| :--- | :--- | :--- |
| Strength Training | 0 | Weightlifting, resistance training |
| Cardio | 1 | Running, cycling, swimming |
| HIIT | 2 | High-Intensity Interval Training |
| Yoga | 3 | Yoga, stretching |
| Other | 4 | Other types of exercise |

### Log a Workout

You can record the following information:

| Field | Description |
| :--- | :--- |
| Name | Name of the workout, e.g., "Morning Run" |
| Type | Workout type |
| Start Time | When the workout started |
| End Time | When the workout ended |
| Duration | Total duration (automatically calculated if not provided) |
| Calories Burned | Estimated calories burned |
| Description | Brief description of the workout |
| Notes | Additional notes |
| Visibility | Private / Public |

### Additional Data (Meta)

In addition to basic info, you can also record:

- **Distance:** Distance for running, cycling, etc.
- **Average Speed:** Average speed during the workout
- **Max Speed:** Highest speed reached
- **Average Heart Rate:** Average heart rate during the workout
- **Max Heart Rate:** Peak heart rate reached
- **Elevation Gain:** Total elevation climbed

### Sharing Workouts in Posts

Once you set a workout record to "Public", you can embed it in a post:
Use the fitness_reference field in your post:
workout:{WorkoutID}


When posting, an option will appear below the editor allowing you to attach fitness data (workouts, metrics, or goals).

**Recommended Data Sync Methods**

**iOS Devices:** We highly recommend using **HealthKit** to sync your workout data. Simply authorize Solar Network to access your health data in settings, and your workouts, steps, heart rate, and more will sync automatically.

**Android Devices:** Since the Google Fit API has been replaced by Google Health Connect, Android data sync is not currently supported. We are working hard to add support in future updates.

---

## Recording Body Metrics

### Metric Types

| Type | Value | Description |
| :--- | :--- | :--- |
| Weight | 0 | Body weight (kg/lbs) |
| Body Fat % | 1 | Body fat percentage |
| Steps | 2 | Daily step count |
| Distance | 3 | Walking/running distance |
| Heart Rate | 4 | Resting or active heart rate |
| Sleep | 5 | Sleep duration/quality |
| Custom | 6 | Other custom metrics |

### How to Record

Log your body metrics, including:
- Metric type
- Value
- Unit
- Recorded time
- Notes

The system will automatically display the latest record for each type, making it easy for you to track changes.

---

## Setting Fitness Goals

### Goal Types

| Type | Value | Description |
| :--- | :--- | :--- |
| Weight Loss | 0 | Weight reduction goal |
| Muscle Gain | 1 | Muscle building goal |
| Endurance | 2 | Endurance goals like running or cycling |
| Steps | 3 | Daily step count goal |
| Custom | 4 | Other custom goals |

### Goal Status

| Status | Value | Description |
| :--- | :--- | :--- |
| In Progress | 0 | Goal is currently active |
| Completed | 1 | Goal has been achieved |
| Paused | 2 | Goal is temporarily paused |
| Cancelled | 3 | Goal has been cancelled |

### Automatic Progress Updates

You can link goals to specific workout or metric types:

- **Link Workout Type:** Automatically updates progress when you log a workout of the specified type.
- **Link Metric Type:** Automatically updates progress when you log a metric of the specified type.

For example:
- Link a "Weight Loss" goal with the "Weight" metric.
- Link an "Endurance" goal with the "Cardio" workout type.

### Recurring Goals

Goals can be set to repeat:

| Recurrence Type | Value | Description |
| :--- | :--- | :--- |
| None | 0 | No repetition |
| Daily | 1 | Repeats daily |
| Weekly | 2 | Repeats weekly |
| Monthly | 3 | Repeats monthly |

You can set the recurrence interval and total number of repetitions.

### Goal Completion

When a goal status changes to "Completed":
- If it is a recurring goal, the system will automatically create the next cycle's goal.
- You will receive a notification.

---

## Exercise Library

The system provides a preset library of exercises, covering:

### Exercise Categories

| Category | Value |
| :--- | :--- |
| Chest | 0 |
| Back | 1 |
| Legs | 2 |
| Arms | 3 |
| Shoulders | 4 |
| Core | 5 |
| Cardio | 6 |
| Other | 7 |

### Exercise Difficulty

| Difficulty | Value |
| :--- | :--- |
| Beginner | 0 |
| Intermediate | 1 |
| Advanced | 2 |

### Adding Exercises to Workouts

You can add multiple exercises to each workout, recording:
- Exercise name
- Sets
- Reps
- Weight
- Notes

---

## Leaderboards

Compare your stats with friends!

### Leaderboard Types

| Type | Description |
| :--- | :--- |
| Calories | Total calories burned |
| Workouts | Total number of workouts completed |
| Goals Completed | Number of goals achieved |

### Time Periods

| Period | Description |
| :--- | :--- |
| Daily | Stats for today |
| Weekly | Stats for this week |
| Monthly | Stats for this month |
| All Time | Lifetime stats |

### Viewing Leaderboards

Leaderboards only include you and your friends, showing:
- Your rank
- Your value
- The gap between you and your friends

---

## FAQ

**Can I import data from other apps?**
Yes, the system supports bulk import via external IDs. You can use data from apps like Strava.

**Do goals update progress automatically?**
Yes, if you link a workout type or metric type, the system will automatically update progress based on your logs. You can also update progress manually.

**Can workout records be deleted?**
Yes, you can delete any workout, metric, or goal record. Once deleted, the data cannot be recovered.

**Is my data secure?**
Yes, all private data is visible only to you. You can switch records between public and private at any time.

**How do I sync my workout data?**

**iOS Users:** We recommend using **HealthKit**. After authorizing Solar Network to access your health data in settings, your workouts, steps, heart rate, etc., will sync automatically.

**Android Users:** Currently, Google Fit/Health Connect sync is not supported. We are working hard to add support in future updates.
