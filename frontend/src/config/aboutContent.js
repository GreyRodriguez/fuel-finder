// Editable content for the About Us page. Change the text here — no component changes needed.
// `icon` must be the name of a lucide-react icon registered in pages/user/About.jsx (ICONS).

export const ABOUT_CONTENT = {
  mission: {
    title: "Our Mission",
    text:
      "FuelFinder helps drivers in Taguig City find the fuel they need at a fair price. " +
      "We bring pump prices, station locations and market updates into one place so you can spend less time " +
      "searching and less money at the pump.",
  },

  pillars: [
    {
      icon: "Target",
      title: "Accurate Prices",
      text: "Every price shown comes from our station database and is checked against community reports and official updates.",
    },
    {
      icon: "Zap",
      title: "Real-time Updates",
      text: "Prices are refreshed every week after fuel-price adjustments, and the map shows the latest values as soon as they change.",
    },
    {
      icon: "Users",
      title: "Community Driven",
      text: "Drivers report the prices they see at the pump. Those reports help us spot outdated or incorrect listings quickly.",
    },
    {
      icon: "Scale",
      title: "Easy Comparison",
      text: "Compare nearby stations side by side by distance and by price, and pick the one that works best for you.",
    },
  ],

  verification: {
    title: "How We Verify Prices",
    intro: "Each price goes through the same four steps before and after it appears on the map.",
    steps: [
      {
        title: "Collection",
        text: "Weekly fuel-price adjustments are collected from public price-watch sources, and station prices are updated by our admin team.",
      },
      {
        title: "Cross-checking with community reports",
        text: "Drivers can submit a Price Report for any station. Reports that differ from the listed price are flagged for review.",
      },
      {
        title: "Comparison with official sources",
        text: "We compare the weekly movement with official advisories and forecasts, such as those from the Department of Energy (DOE).",
      },
      {
        title: "Regular refresh",
        text: "Station prices are refreshed weekly, and the Latest Updates page tracks the weekly average so you can see how prices moved.",
      },
    ],
  },
};

