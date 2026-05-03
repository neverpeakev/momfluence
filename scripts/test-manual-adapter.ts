import { buildManualAffiliateUrl } from "../lib/adapters/manual";

type Case = {
  name: string;
  input: { ctaUrlTemplate: string; subId: string; networkSlug: string };
  expect: string | { throws: string };
};

const cases: Case[] = [
  {
    name: "1. impact, single existing param",
    input: {
      ctaUrlTemplate: "https://www.openfarmpet.com/?utm_source=impact",
      subId: "abc12345",
      networkSlug: "impact"
    },
    expect: "https://www.openfarmpet.com/?utm_source=impact&subId1=abc12345"
  },
  {
    name: "2. flexoffers, no existing params",
    input: {
      ctaUrlTemplate: "https://www.example.com/landing",
      subId: "xyz98765",
      networkSlug: "flexoffers"
    },
    expect: "https://www.example.com/landing?fobs=xyz98765"
  },
  {
    name: "3. cj, generic subid fallback",
    input: {
      ctaUrlTemplate: "https://www.example.com/page?ref=foo",
      subId: "mid44444",
      networkSlug: "cj"
    },
    expect: "https://www.example.com/page?ref=foo&subid=mid44444"
  },
  {
    name: "4. empty cta_url throws",
    input: { ctaUrlTemplate: "", subId: "abc12345", networkSlug: "impact" },
    expect: { throws: "missing cta_url for offer" }
  },
  {
    name: "5. cj with hash fragment, param goes before hash",
    input: {
      ctaUrlTemplate: "https://www.example.com/landing#section",
      subId: "mid44444",
      networkSlug: "cj"
    },
    expect: "https://www.example.com/landing?subid=mid44444#section"
  },
  {
    name: "6. flexoffers production reality (5 existing params, fobs appended last)",
    input: {
      ctaUrlTemplate:
        "https://track.flexlinkspro.com/g.ashx?foid=1.42392.1000000206&trid=1216037.191558&foc=16&fot=9999&fos=6",
      subId: "abc12345",
      networkSlug: "flexoffers"
    },
    expect:
      "https://track.flexlinkspro.com/g.ashx?foid=1.42392.1000000206&trid=1216037.191558&foc=16&fot=9999&fos=6&fobs=abc12345"
  }
];

let passed = 0;
let failed = 0;

for (const c of cases) {
  if (typeof c.expect === "object" && "throws" in c.expect) {
    try {
      const got = buildManualAffiliateUrl(c.input);
      console.log(`FAIL ${c.name}`);
      console.log(`  expected throw: ${c.expect.throws}`);
      console.log(`  got: ${got}`);
      failed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === c.expect.throws) {
        console.log(`PASS ${c.name}`);
        passed++;
      } else {
        console.log(`FAIL ${c.name}`);
        console.log(`  expected throw: ${c.expect.throws}`);
        console.log(`  got throw: ${msg}`);
        failed++;
      }
    }
    continue;
  }

  try {
    const got = buildManualAffiliateUrl(c.input);
    if (got === c.expect) {
      console.log(`PASS ${c.name}`);
      passed++;
    } else {
      console.log(`FAIL ${c.name}`);
      console.log(`  expected: ${c.expect}`);
      console.log(`  got:      ${got}`);
      failed++;
    }
  } catch (e) {
    console.log(`FAIL ${c.name} (unexpected throw)`);
    console.log(`  ${e instanceof Error ? e.message : String(e)}`);
    failed++;
  }
}

console.log(`\n${passed}/${cases.length} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
