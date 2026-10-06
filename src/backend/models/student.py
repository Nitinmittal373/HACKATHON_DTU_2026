from dataclasses import dataclass, field
from typing import List


@dataclass
class CalibrationEntry:
    task:   str
    rated:  int
    actual: int


@dataclass
class TodaySession:
    focus_seconds:  int = 0
    total_seconds:  int = 1
    tab_switches:   int = 0
    correct_streak: int = 0


@dataclass
class WeekData:
    tasks_attempted:  int = 0
    tasks_no_hint:    int = 0
    hints_this_week:  int = 0
    hints_last_week:  int = 0


@dataclass
class RetryData:
    retried_count:     int   = 0
    eventual_success:  int   = 0
    avg_retries:       float = 0.0


@dataclass
class Student:
    id:          str
    name:        str
    today:       TodaySession          = field(default_factory=TodaySession)
    week:        WeekData              = field(default_factory=WeekData)
    retries:     RetryData             = field(default_factory=RetryData)
    calibration: List[CalibrationEntry] = field(default_factory=list)
