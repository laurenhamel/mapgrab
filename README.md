# MapGrab

> A CLI utility to automate screen grabs of a MapTiler map

This MapGrab tool was created to help with easily piecing together big map images. It works by calculating a grid for the map area that's given, then taking screenshots of each tile within the grid. The resulting tile images include some overlapping areas to easily allow you to then run the images through a stitching tool like [AutoStitch][AutoStitch] You can easily customize the look and feel of your map by plugging in your own MapTiler map ID containing your own custom colors.

# Installation

1. Clone the repository.

```bash
git clone git@github.com:laurenhamel/mapgrab.git
```

2. Install the dependencies.

```bash
npm i
```

# Usage

To start generating map images, use the following command(s) in your terminal window:

**Generating a Map from Default Coordinates:**

```bash
# mapgrab -l <location>
mapgrab -l Atlanta
```

**Generating a Map from Custom Coordinates:**

```bash
# mapgrab -l <location -c <coordinates>
mapgrab -l Atlanta -c "[33.608576, -84.513990] [33.926377, -84.211179]"
```


**Generating a Specific Map Tile:**

```bash
# mapgrab -l <location> -t <tile>
mapgrab -l Atlanta -t 5
```

  > This is useful if the tile did not fully load before the screenshot was taken. The `-t` option can be used with both default coordinates and custom coordinates.

# Example

Below is an example map after using the MapGrab tool and running the generated images through [AutoStitch][AutoStitch]:

![Atlanta](/docs/Atlanta.jpg?raw=true "Atlanta")


[AutoStitch]: http://matthewalunbrown.com/autostitch/autostitch.html
