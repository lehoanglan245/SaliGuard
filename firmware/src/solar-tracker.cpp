#include "solar-tracker.h"
#include "config.h"

struct DriverPins {
	uint8_t step;
	uint8_t dir;
	uint8_t en;  // active-LOW
};

static const DriverPins TILT = { PIN_TILT_STEP, PIN_TILT_DIR, PIN_TILT_EN };
static const DriverPins ROT = { PIN_ROT_STEP, PIN_ROT_DIR, PIN_ROT_EN };

static const DriverPins& pinsFor(Axis axis) {
	return (axis == Axis::Tilt) ? TILT : ROT;
}

static void setupDriver(const DriverPins& d) {
	pinMode(d.step, OUTPUT);
	pinMode(d.dir, OUTPUT);
	pinMode(d.en, OUTPUT);
	digitalWrite(d.step, LOW);
	digitalWrite(d.dir, LOW);
	digitalWrite(d.en, HIGH);  // nhả motor lúc khởi động
}

void trackerBegin() {
	setupDriver(TILT);
	setupDriver(ROT);
}

void trackerMoveSteps(Axis axis, int32_t steps, uint16_t stepDelayUs) {
	if (steps == 0) return;
	const DriverPins& d = pinsFor(axis);

	digitalWrite(d.dir, steps > 0 ? HIGH : LOW);
	digitalWrite(d.en, LOW);  // cấp dòng
	delayMicroseconds(5);     // DRV8825 cần ~650ns sau khi enable trước xung STEP

	const uint32_t count = abs(steps);
	for (uint32_t i = 0; i < count; i++) {
		digitalWrite(d.step, HIGH);
		delayMicroseconds(stepDelayUs);
		digitalWrite(d.step, LOW);
		delayMicroseconds(stepDelayUs);
	}

	digitalWrite(d.en, HIGH);  // nhả lại để không nóng driver/motor
}
