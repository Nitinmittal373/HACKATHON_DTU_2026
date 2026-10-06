"""
Score calculation formulas — mirrors the logic in src/frontend/js/data.js.
Keep both files in sync when updating formulas.
"""


def _r(n: float) -> float:
    return round(n * 10) / 10


def calc_concentration(today: dict) -> dict:
    focus_seconds  = today.get('focusSeconds', 0)
    total_seconds  = today.get('totalSeconds', 1)
    tab_switches   = today.get('tabSwitches', 0)
    correct_streak = today.get('correctStreak', 0)

    fp             = focus_seconds / total_seconds
    base           = _r(fp * 60)
    switch_penalty = min(tab_switches * 4, 15)
    streak_bonus   = min(correct_streak * 5, 25)
    total          = max(0, min(100, _r(base - switch_penalty + streak_bonus)))

    return {
        'base': base, 'switchPenalty': switch_penalty,
        'streakBonus': streak_bonus, 'focusPct': fp, 'total': total
    }


def calc_reliance(week: dict) -> dict:
    tasks_attempted = week.get('tasksAttempted', 1)
    tasks_no_hint   = week.get('tasksNoHint', 0)
    hints_this_week = week.get('hintsThisWeek', 0)
    hints_last_week = week.get('hintsLastWeek', 0)

    nhp        = tasks_no_hint / tasks_attempted
    base       = _r(nhp * 70)
    hd         = (hints_last_week - hints_this_week) / hints_last_week if hints_last_week > 0 else 0
    trend_bonus = _r(max(0, hd) * 30)
    total       = max(0, min(100, _r(base + trend_bonus)))

    return {
        'base': base, 'trendBonus': trend_bonus,
        'noHintPct': nhp, 'hintDrop': hd, 'total': total
    }


def calc_perseverance(retries: dict) -> dict:
    retried_count    = retries.get('retriedCount', 1)
    eventual_success = retries.get('eventualSuccess', 0)
    avg_retries      = retries.get('avgRetries', 0)

    sr   = eventual_success / retried_count
    base = _r(sr * 65)
    rf   = 35 if 2 <= avg_retries <= 3.2 else max(0, 35 - abs(avg_retries - 2.5) * 12)
    total = max(0, min(100, _r(base + _r(rf))))

    return {'base': base, 'rangeFit': _r(rf), 'successRate': sr, 'total': total}


def calc_confidence(calibration: list) -> dict:
    if not calibration:
        return {'avgErr': 0, 'calibScore': 0, 'hardBonus': 0, 'total': 0}

    errs = [abs(row.get('rated', 0) - row.get('actual', 0)) for row in calibration]
    ae   = sum(errs) / len(errs)
    cs   = _r(max(0, 100 - ae * 22))
    ah   = sum(1 for row in calibration if row.get('rated', 0) >= 4)
    hb   = min(ah * 4, 20)
    total = max(0, min(100, _r(cs * 0.8 + hb)))

    return {'avgErr': _r(ae), 'calibScore': cs, 'hardBonus': hb, 'total': total}


def calc_character(conc: float, rel: float, pers: float, conf: float) -> dict:
    return {'total': _r(conc * 0.25 + rel * 0.25 + pers * 0.25 + conf * 0.25)}
